import { useState, useEffect, useCallback, useRef } from "react";
import type { FhevmInstance } from "@zama-fhe/relayer-sdk/bundle";
import type { Eip1193Provider } from "ethers";
import type { BrowserProvider, Signer } from "ethers";
import { ethers } from "ethers";
import { WhistleBlower } from "@/abi/WhistleBlowerABI";
import { WhistleBlowerAddresses } from "@/abi/WhistleBlowerAddresses";
import { FhevmDecryptionSignature } from "@/fhevm/FhevmDecryptionSignature";
import type { GenericStringStorage } from "@/fhevm/GenericStringStorage";

type Report = {
  id: number;
  reporter: string;
  status: string;
  timestamp: number;
  decryptedContent?: string;
  decryptedSeverity?: number;
};

// 本地存储内容哈希映射，用于解密后还原原始内容
const CONTENT_STORAGE_KEY = "whistleblower_content_map";

function saveContentMapping(hash: string, content: string) {
  try {
    const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
    const map = stored ? JSON.parse(stored) : {};
    map[hash] = content;
    localStorage.setItem(CONTENT_STORAGE_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn("Failed to save content mapping:", e);
  }
}

function getContentByHash(hash: string): string | null {
  try {
    const stored = localStorage.getItem(CONTENT_STORAGE_KEY);
    if (!stored) return null;
    const map = JSON.parse(stored);
    return map[hash] || null;
  } catch (e) {
    console.warn("Failed to get content mapping:", e);
    return null;
  }
}

interface UseWhistleBlowerProps {
  instance: FhevmInstance | null | undefined;
  fhevmDecryptionSignatureStorage: GenericStringStorage;
  eip1193Provider: Eip1193Provider | null | undefined;
  chainId: number | null | undefined;
  ethersSigner: Signer | null | undefined;
  ethersReadonlyProvider: BrowserProvider | null | undefined;
  sameChain: boolean;
  sameSigner: boolean;
}

export function useWhistleBlower({
  instance,
  fhevmDecryptionSignatureStorage,
  eip1193Provider,
  chainId,
  ethersSigner,
  ethersReadonlyProvider,
  sameChain,
  sameSigner,
}: UseWhistleBlowerProps) {
  const [contractAddress, setContractAddress] = useState<string>("");
  const [isDeployed, setIsDeployed] = useState<boolean | null>(null);
  const [totalReports, setTotalReports] = useState<number>(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [message, setMessage] = useState("");

  const canSubmit = Boolean(
    instance && ethersSigner && isDeployed && !isSubmitting
  );

  // Determine contract address based on chain
  useEffect(() => {
    if (!chainId) {
      setContractAddress("");
      return;
    }

    const entry = (WhistleBlowerAddresses as any)[String(chainId)];
    if (entry && entry.address) {
      setContractAddress(entry.address);
    } else {
      setContractAddress("");
    }
  }, [chainId]);

  // Check if contract is deployed
  useEffect(() => {
    async function checkDeployment() {
      if (!contractAddress || !ethersReadonlyProvider) {
        setIsDeployed(null);
        return;
      }

      try {
        const code = await ethersReadonlyProvider.getCode(contractAddress);
        setIsDeployed(code !== "0x");
      } catch (error) {
        console.error("Error checking deployment:", error);
        setIsDeployed(false);
      }
    }

    checkDeployment();
  }, [contractAddress, ethersReadonlyProvider]);

  // Fetch total reports
  const fetchTotalReports = useCallback(async () => {
    if (!contractAddress || !ethersReadonlyProvider || !isDeployed) return;

    try {
      const contract = new ethers.Contract(
        contractAddress,
        WhistleBlower.abi,
        ethersReadonlyProvider
      );
      const total = await contract.getTotalReports();
      setTotalReports(Number(total));
    } catch (error) {
      console.error("Error fetching total reports:", error);
    }
  }, [contractAddress, ethersReadonlyProvider, isDeployed]);

  useEffect(() => {
    fetchTotalReports();
  }, [fetchTotalReports]);

  // Submit encrypted report
  const submitReport = useCallback(
    async (content: string, severity: number) => {
      if (!instance || !ethersSigner || !contractAddress) {
        setMessage("Missing required dependencies");
        return;
      }

      setIsSubmitting(true);
      setMessage("Encrypting and submitting report...");

      try {
        // Convert content string to a number (use hash for deterministic encryption)
        const contentBytes = ethers.toUtf8Bytes(content);
        const contentHash = BigInt(ethers.keccak256(contentBytes));
        const contentNumber = contentHash % BigInt(2 ** 64); // Fit into uint64 range
        
        // 保存内容映射，用于解密后还原
        const hashHex = `0x${contentNumber.toString(16)}`;
        saveContentMapping(hashHex, content);

        // Encrypt content as euint64
        const encryptedContent = await instance.createEncryptedInput(
          contractAddress,
          await ethersSigner.getAddress()
        );
        encryptedContent.add64(contentNumber);
        const { handles: contentHandles, inputProof: contentProof } =
          await encryptedContent.encrypt();

        // Encrypt severity as euint32
        const encryptedSeverity = await instance.createEncryptedInput(
          contractAddress,
          await ethersSigner.getAddress()
        );
        encryptedSeverity.add32(severity);
        const { handles: severityHandles, inputProof: severityProof } =
          await encryptedSeverity.encrypt();

        // Submit to contract
        const contract = new ethers.Contract(
          contractAddress,
          WhistleBlower.abi,
          ethersSigner
        );

        const tx = await contract.submitReport(
          contentHandles[0],
          contentProof,
          severityHandles[0],
          severityProof
        );

        setMessage("Transaction submitted, waiting for confirmation...");
        await tx.wait();

        setMessage("Report submitted successfully!");
        await fetchTotalReports();
        await refreshReports();

        setTimeout(() => setMessage(""), 5000);
      } catch (error: any) {
        console.error("Error submitting report:", error);
        const errorMessage = error.reason || error.message || "Failed to submit report";
        setMessage(`Submission failed: ${errorMessage}`);
        setTimeout(() => setMessage(""), 5000);
      } finally {
        setIsSubmitting(false);
      }
    },
    [instance, ethersSigner, contractAddress, fetchTotalReports]
  );

  // Refresh reports list
  const refreshReports = useCallback(async () => {
    if (!contractAddress || !ethersReadonlyProvider || !isDeployed) return;

    setIsRefreshing(true);

    try {
      const contract = new ethers.Contract(
        contractAddress,
        WhistleBlower.abi,
        ethersReadonlyProvider
      );

      const total = await contract.getTotalReports();
      const totalNum = Number(total);

      const reportsData: Report[] = [];

      // Define status names once outside loop for better performance
      const statusNames = ["Pending", "Under Review", "Resolved", "Rejected"];
      
      for (let i = 0; i < totalNum; i++) {
        try {
          const metadata = await contract.getReportMetadata(i);
          
          reportsData.push({
            id: i,
            reporter: metadata[0],
            status: statusNames[Number(metadata[1])] || "Unknown",
            timestamp: Number(metadata[2]),
          });
        } catch (error) {
          console.error(`Error fetching report ${i}:`, error);
        }
      }

      setReports(reportsData);
    } catch (error) {
      console.error("Error refreshing reports:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [contractAddress, ethersReadonlyProvider, isDeployed]);

  useEffect(() => {
    if (isDeployed) {
      refreshReports();
    }
  }, [isDeployed, refreshReports]);

  // Decrypt report (FHEVM userDecrypt with wallet signature)
  const decryptReport = useCallback(
    async (reportId: number) => {
      if (!instance || !ethersSigner || !contractAddress) {
        setMessage("Missing required dependencies for decryption");
        return;
      }

      setIsDecrypting(true);
      setMessage("Preparing FHEVM decryption signature...");

      try {
        const sig = await FhevmDecryptionSignature.loadOrSign(
          instance,
          [contractAddress as `0x${string}`],
          ethersSigner,
          fhevmDecryptionSignatureStorage
        );

        if (!sig) {
          setMessage("Unable to build FHEVM decryption signature");
          return;
        }

        const contract = new ethers.Contract(
          contractAddress,
          WhistleBlower.abi,
          ethersReadonlyProvider || ethersSigner
        );

        // Get encrypted handles from contract
        const contentHandle: string = await contract.getReportContent(reportId);
        const severityHandle: string = await contract.getReportSeverity(reportId);

        setMessage("Calling FHEVM userDecrypt...");

        const res = await instance.userDecrypt(
          [
            { handle: contentHandle, contractAddress },
            { handle: severityHandle, contractAddress },
          ],
          sig.privateKey,
          sig.publicKey,
          sig.signature,
          sig.contractAddresses,
          sig.userAddress,
          sig.startTimestamp,
          sig.durationDays
        );

        const decryptedContentValue = res[contentHandle];
        const decryptedSeverityValue = res[severityHandle];

        setReports((prevReports) =>
          prevReports.map((report) => {
            if (report.id !== reportId) return report;
            
            // 尝试从本地存储还原原始内容
            const hashHex = decryptedContentValue
              ? `0x${decryptedContentValue.toString(16)}`
              : "";
            const originalContent = hashHex ? getContentByHash(hashHex) : null;
            
            return {
              ...report,
              // 如果找到原始内容则显示，否则显示哈希
              decryptedContent: originalContent || hashHex || "",
              decryptedSeverity: decryptedSeverityValue
                ? Number(decryptedSeverityValue)
                : undefined,
            };
          })
        );

        setMessage("FHEVM decryption completed");
        setTimeout(() => setMessage(""), 3000);
      } catch (error: any) {
        console.error("Error decrypting report:", error);
        const errorMessage = error.reason || error.message || "Failed to decrypt";
        setMessage(`Decryption failed: ${errorMessage}`);
        setTimeout(() => setMessage(""), 5000);
      } finally {
        setIsDecrypting(false);
      }
    },
    [
      instance,
      ethersSigner,
      contractAddress,
      ethersReadonlyProvider,
      fhevmDecryptionSignatureStorage,
    ]
  );

  return {
    contractAddress,
    isDeployed,
    totalReports,
    reports,
    isSubmitting,
    isRefreshing,
    isDecrypting,
    canSubmit,
    message,
    submitReport,
    refreshReports,
    decryptReport,
  };
}
