import { useEffect, useRef } from "react";
import type { Eip1193Provider } from "ethers";

const SEPOLIA_CHAIN_ID = 11155111;
const FALLBACK_RPC = "https://sepolia.infura.io/v3/8f7d90378a814251afabcf6425269276";

type UseEnsureSepoliaRpcProps = {
  provider: Eip1193Provider | null | undefined;
  chainId: number | null | undefined;
};

/**
 * Guard against MetaMask's default Sepolia RPC issues by prompting
 * the user to add a fallback RPC if they're on Sepolia.
 */
export function useEnsureSepoliaRpc({ provider, chainId }: UseEnsureSepoliaRpcProps) {
  const hasPromptedRef = useRef(false);

  useEffect(() => {
    if (!provider || chainId !== SEPOLIA_CHAIN_ID || hasPromptedRef.current) {
      return;
    }

    hasPromptedRef.current = true;

    // Optional: You can add logic here to prompt users to add a custom RPC
    // For now, we'll just log a warning
    console.warn(
      "You are on Sepolia. If you experience RPC issues, consider adding a custom RPC endpoint."
    );
  }, [provider, chainId]);
}
