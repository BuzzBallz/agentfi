import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import AgentNFTv2Abi from '@/abi/AgentNFTv2.json';
import AgentMarketplacev2Abi from '@/abi/AgentMarketplacev2.json';
import { parseEther, keccak256, toBytes, decodeEventLog } from 'viem';

export function useMintAgent() {
  const {
    writeContract: writeMint,
    data: mintHash,
    isPending: mintPending,
    isError: mintError,
    error: mintErrorMsg,
    reset: resetMint,
  } = useWriteContract();

  const { isLoading: mintConfirming, isSuccess: mintSuccess, data: mintReceipt } =
    useWaitForTransactionReceipt({ hash: mintHash });

  const mint = (
    _to: `0x${string}`,
    name: string,
    description: string,
    capabilities: string,
    priceOG: string,
    tokenURI: string,
    systemPrompt?: string,
  ) => {
    const priceWei = parseEther(priceOG);

    // Include system prompt in metadataHash — intelligence is verifiable on-chain
    const hashInput = systemPrompt
      ? `${name}:${description}:${capabilities}:${systemPrompt}`
      : `${name}:${description}:${capabilities}`;
    const metadataHash = keccak256(toBytes(hashInput));

    // Store intelligence payload in encryptedURI (data URI for demo, 0G Storage URL in prod)
    let encryptedURI = "";
    if (systemPrompt) {
      const intelligencePayload = JSON.stringify({
        system_prompt: systemPrompt,
        model: "claude-haiku-4-5",
        name,
        description,
      });
      const utf8Bytes = new TextEncoder().encode(intelligencePayload);
      const binaryStr = Array.from(utf8Bytes, (b) => String.fromCharCode(b)).join("");
      encryptedURI = `data:application/json;base64,${btoa(binaryStr)}`;
    }

    writeMint({
      address: CONTRACT_ADDRESSES.AgentNFT as `0x${string}`,
      abi: AgentNFTv2Abi,
      functionName: 'publicMint',
      args: [
        tokenURI,
        { name, description, capabilities, pricePerCall: priceWei },
        metadataHash,
        encryptedURI,
        "0x",  // sealedKey — would use real encryption key with 0G Storage in prod
      ],
      chainId: 16602,
    });
  };

  // Parse tokenId from Transfer event in mint receipt
  const mintedTokenId = (() => {
    if (!mintReceipt?.logs) return null;
    for (const log of mintReceipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: AgentNFTv2Abi,
          data: log.data,
          topics: log.topics,
        });
        if (decoded.eventName === 'Transfer' || decoded.eventName === 'AgentMinted') {
          const args = decoded.args as unknown as Record<string, unknown>;
          const tid = args.tokenId;
          if (tid !== undefined) return Number(tid);
        }
      } catch {
        // Not our event, skip
      }
    }
    return null;
  })();

  return {
    mint,
    mintHash,
    mintPending,
    mintConfirming,
    mintSuccess,
    mintError,
    mintErrorMsg,
    resetMint,
    mintedTokenId,
  };
}

export function useListAgent() {
  const {
    writeContract: writeList,
    data: listHash,
    isPending: listPending,
    isError: listError,
    error: listErrorMsg,
    reset: resetList,
  } = useWriteContract();

  const { isLoading: listConfirming, isSuccess: listSuccess } =
    useWaitForTransactionReceipt({ hash: listHash });

  const listAgent = (tokenId: number, priceA0GI: string) => {
    const priceWei = parseEther(priceA0GI);
    writeList({
      address: CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`,
      abi: AgentMarketplacev2Abi,
      functionName: 'listAgent',
      args: [BigInt(tokenId), priceWei],
      chainId: 16602,
    });
  };

  return {
    listAgent,
    listHash,
    listPending,
    listConfirming,
    listSuccess,
    listError,
    listErrorMsg,
    resetList,
  };
}
