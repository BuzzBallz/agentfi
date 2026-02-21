import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import ADIAgentPaymentsAbi from "@/abi/ADIAgentPayments.json";
import { CONTRACT_ADDRESSES } from "@/config/contracts";

export function useADIPayment() {
  const publicClient = usePublicClient();
  const [paymentId, setPaymentId] = useState<number | null>(null);
  const [paymentIdError, setPaymentIdError] = useState<string | null>(null);

  const {
    writeContract,
    data: hash,
    isPending,
    isError,
    error,
    reset,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const payForAgent = useCallback(
    (serviceId: number, priceADI: string) => {
      setPaymentId(null);
      setPaymentIdError(null);
      writeContract({
        address: CONTRACT_ADDRESSES.ADIAgentPayments as `0x${string}`,
        abi: ADIAgentPaymentsAbi,
        functionName: "payForAgentService",
        args: [BigInt(serviceId)],
        value: parseEther(priceADI),
        chainId: 99999,
        gas: BigInt(500_000),
      });
    },
    [writeContract],
  );

  // Extract paymentId from tx receipt logs after confirmation
  useEffect(() => {
    if (!isSuccess || !hash || !publicClient) return;

    publicClient
      .getTransactionReceipt({ hash })
      .then((receipt) => {
        for (const log of receipt.logs) {
          try {
            const decoded = decodeEventLog({
              abi: ADIAgentPaymentsAbi,
              data: log.data,
              topics: log.topics,
            });
            if (
              decoded.eventName === "CompliancePayment" &&
              decoded.args &&
              "paymentId" in decoded.args
            ) {
              setPaymentId(Number(decoded.args.paymentId));
              return;
            }
          } catch {
            // not our event, skip
          }
        }
        // Could not parse paymentId from logs — use paymentCount heuristic
        setPaymentIdError("Could not extract paymentId from tx logs");
      })
      .catch((err) => {
        setPaymentIdError(`Receipt fetch failed: ${err?.message ?? err}`);
      });
  }, [isSuccess, hash, publicClient]);

  return {
    payForAgent,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    paymentId,
    paymentIdError,
    reset,
  };
}
