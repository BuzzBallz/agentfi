import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, decodeEventLog } from "viem";
import { usePublicClient } from "wagmi";
import { useCallback, useEffect, useState } from "react";
import ADIAgentPaymentsAbi from "@/abi/ADIAgentPayments.json";
import { CONTRACT_ADDRESSES } from "@/config/contracts";

export function useADIPayment() {
  const publicClient = usePublicClient();
  const [paymentId, setPaymentId] = useState<number | null>(null);

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
      writeContract({
        address: CONTRACT_ADDRESSES.ADIAgentPayments as `0x${string}`,
        abi: ADIAgentPaymentsAbi,
        functionName: "payForAgentService",
        args: [BigInt(serviceId)],
        value: parseEther(priceADI),
        chainId: 99999,
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
        // fallback: use 0 if we can't parse logs (demo)
        setPaymentId(0);
      })
      .catch(() => setPaymentId(0));
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
    reset,
  };
}
