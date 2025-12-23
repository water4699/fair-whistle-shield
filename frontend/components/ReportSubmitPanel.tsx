"use client";

import { useEffect, useRef, useState } from "react";
import { Shield } from "lucide-react";
import { useFhevm } from "@/fhevm/useFhevm";
import { useInMemoryStorage } from "@/hooks/useInMemoryStorage";
import { useMetaMaskEthersSigner } from "@/hooks/metamask/useMetaMaskEthersSigner";
import { useWhistleBlower } from "@/hooks/useWhistleBlower";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useEnsureSepoliaRpc } from "@/hooks/metamask/useEnsureSepoliaRpc";

export function ReportSubmitPanel() {
  const [reportContent, setReportContent] = useState("");
  const [severity, setSeverity] = useState("3");

  const { storage: fhevmDecryptionSignatureStorage } = useInMemoryStorage();
  const {
    provider,
    chainId,
    isConnected,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
    initialMockChains,
  } = useMetaMaskEthersSigner();

  const { instance: fhevmInstance } = useFhevm({
    provider,
    chainId,
    initialMockChains,
    enabled: true,
  });

  const whistleBlower = useWhistleBlower({
    instance: fhevmInstance,
    fhevmDecryptionSignatureStorage,
    eip1193Provider: provider,
    chainId,
    ethersSigner,
    ethersReadonlyProvider,
    sameChain,
    sameSigner,
  });

  const { add: addLog } = useActivityLog();
  const lastMessageRef = useRef<string>("");

  // Guard MetaMask Sepolia RPC issues by prompting a fallback RPC chain
  useEnsureSepoliaRpc({ provider, chainId });

  const submitEncrypted = () => {
    const content = reportContent.trim();
    const sev = parseInt(severity, 10);
    
    // Validate inputs
    if (!content) {
      addLog({ type: "error", title: "Validation Error", details: "Report content cannot be empty" });
      return;
    }
    if (!Number.isFinite(sev) || sev < 1 || sev > 5) {
      addLog({ type: "error", title: "Validation Error", details: "Invalid severity level" });
      return;
    }
    
    addLog({ type: "report_submit", title: "Submit Encrypted Report", details: `severity=${sev}` });
    whistleBlower.submitReport(content, sev);
  };

  // Mirror whistleBlower messages into activity log
  useEffect(() => {
    const m = whistleBlower.message || "";
    if (!m || m === lastMessageRef.current) return;
    lastMessageRef.current = m;

    if (m.includes("successfully")) {
      addLog({ type: "report_submit", title: "Report Submitted", details: m });
      setReportContent("");
      setSeverity("3");
    } else if (m.toLowerCase().includes("failed") || m.toLowerCase().includes("error")) {
      addLog({ type: "error", title: "Operation Failed", details: m });
    } else if (m) {
      addLog({ type: "info", title: "Status Update", details: m });
    }
  }, [whistleBlower.message, addLog]);

  return (
    <div className="card w-full max-w-xl bg-base-100 shadow-xl border">
      <div className="card-body">
        <h2 className="card-title">Submit Encrypted Report</h2>

        <div className="grid grid-cols-1 gap-4">
          {/* Report content */}
          <div>
            <div className="label">
              <span className="label-text">Report Content</span>
            </div>
            <textarea
              placeholder="Describe the issue (will be encrypted)..."
              className="textarea textarea-bordered w-full h-32"
              value={reportContent}
              onChange={(e) => setReportContent(e.target.value)}
            />
          </div>

          {/* Severity selector */}
          <div>
            <div className="label">
              <span className="label-text">Severity Level</span>
              <select
                className="select select-bordered select-sm"
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
              >
                <option value="1">1 - Low</option>
                <option value="2">2 - Medium</option>
                <option value="3">3 - High</option>
                <option value="4">4 - Severe</option>
                <option value="5">5 - Critical</option>
              </select>
            </div>
          </div>

          {/* Privacy info */}
          <div className="alert">
            <Shield className="w-5 h-5" />
            <div>
              <h3 className="font-bold">Protected Report</h3>
              <div className="text-sm opacity-70">Content and severity are encrypted on-chain for privacy.</div>
            </div>
          </div>
        </div>

        <div className="card-actions mt-2 justify-end">
          <button
            className="btn btn-primary"
            type="button"
            disabled={!isConnected || !whistleBlower.canSubmit || !reportContent.trim()}
            onClick={submitEncrypted}
          >
            {isConnected ? (whistleBlower.isSubmitting ? "Submitting..." : "Submit Encrypted Report") : "Connect Wallet"}
          </button>
        </div>

        {/* Status */}
        <div className="text-xs text-base-content/70">
          {whistleBlower.message}
        </div>
      </div>
    </div>
  );
}
