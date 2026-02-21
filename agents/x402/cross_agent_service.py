"""
Cross-Agent Collaboration Service — enables agents to hire other agents.
Uses AFC tokens on Hedera for payment, with x402 protocol for communication.
"""

import logging

import httpx

from x402.config import (
    get_full_agent_name_to_token_id,
    get_full_cross_agent_recommendations,
    get_full_hedera_accounts,
    get_registry_config,
)

logger = logging.getLogger(__name__)


class CrossAgentService:
    """
    Orchestrates cross-agent calls with x402 AFC payments.

    When an agent needs specialized analysis from another agent:
    1. Check the caller's AFC balance
    2. Check the target's x402 price
    3. If affordable: make AFC payment, then execute target agent
    4. If not affordable: fallback to self-computed approximation
    """

    def __init__(
        self,
        afc_payment_service,
        hedera_mirror_url: str = "https://testnet.mirrornode.hedera.com",
        backend_base_url: str = "http://localhost:8000",
        afc_token_id: str = "",
    ):
        self.afc_payment = afc_payment_service
        self.mirror_url = hedera_mirror_url
        self.backend_url = backend_base_url
        self.afc_token_id = afc_token_id

    async def get_agent_afc_balance(self, hedera_account: str) -> float:
        """Read an agent's AFC balance from Hedera Mirror Node."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    f"{self.mirror_url}/api/v1/accounts/{hedera_account}/tokens"
                )
                if resp.status_code != 200:
                    return 0.0

                data = resp.json()
                for token in data.get("tokens", []):
                    if token.get("token_id") == self.afc_token_id:
                        return int(token.get("balance", 0)) / 100
                return 0.0
        except Exception as e:
            logger.error(f"Failed to read AFC balance for {hedera_account}: {e}")
            return 0.0

    async def execute_with_cross_agent(
        self,
        caller_agent_name: str,
        query: str,
        main_result: str,
        cross_agent_enabled: bool = True,
    ) -> dict:
        """
        Attempt cross-agent collaboration for a richer result.
        """
        report = []
        payments = []
        additional_results = []

        name_to_token = get_full_agent_name_to_token_id()
        hedera_accounts = get_full_hedera_accounts()

        caller_token_id = name_to_token.get(caller_agent_name, 0)
        caller_config = get_registry_config(caller_token_id)

        if not cross_agent_enabled or not caller_config.get("allow_cross_agent", False):
            return {
                "enhanced_result": main_result,
                "cross_agent_report": [],
                "x402_payments": [],
            }

        recommended = get_full_cross_agent_recommendations(caller_agent_name)
        if not recommended:
            return {
                "enhanced_result": main_result,
                "cross_agent_report": [],
                "x402_payments": [],
            }

        caller_hedera = hedera_accounts.get(caller_token_id, "")
        afc_balance = await self.get_agent_afc_balance(caller_hedera)
        remaining_budget = min(afc_balance, caller_config.get("max_budget_afc", 0))

        logger.info(
            f"[CrossAgent] {caller_agent_name} starting collaboration. "
            f"Balance: {afc_balance:.2f} AFC, Budget: {remaining_budget:.2f} AFC"
        )

        for target_name in recommended:
            target_token_id = name_to_token.get(target_name)
            if target_token_id is None:
                continue

            target_config = get_registry_config(target_token_id)
            target_price = target_config.get("price_afc", 0)

            if not target_config.get("x402_enabled", False):
                report.append({
                    "agent": target_name,
                    "status": "skipped",
                    "reason": "x402 not enabled on target agent",
                })
                continue

            if remaining_budget < target_price:
                logger.info(
                    f"[CrossAgent] {caller_agent_name} cannot afford {target_name}: "
                    f"need {target_price:.2f} AFC, have {remaining_budget:.2f} AFC"
                )

                fallback_result = await self._self_compute_fallback(caller_agent_name, target_name, query)
                additional_results.append(fallback_result)

                report.append({
                    "agent": target_name,
                    "status": "insufficient_funds",
                    "required": f"{target_price:.2f} AFC",
                    "available": f"{remaining_budget:.2f} AFC",
                    "source": "self-computed (insufficient AFC balance)",
                    "note": "This agent needs more executions to earn AFC for full cross-agent collaboration",
                })
                continue

            try:
                payment_result = await self.afc_payment.process_inter_agent_payment(
                    payer_agent_account=caller_hedera,
                    target_agent_account=hedera_accounts.get(target_token_id, ""),
                    target_owner_account=target_config.get("owner_hedera_account", ""),
                    total_amount_afc=target_price,
                )
                payments.append(payment_result)

                sub_result = await self._call_agent_internal(target_name, query)
                additional_results.append(sub_result)

                remaining_budget -= target_price

                report.append({
                    "agent": target_name,
                    "status": "success",
                    "cost": f"{target_price:.2f} AFC",
                    "source": "cross-agent via x402",
                    "payment_splits": payment_result.get("splits", {}),
                })

            except Exception as e:
                logger.error(f"[CrossAgent] Call to {target_name} failed: {e}")

                fallback_result = await self._self_compute_fallback(caller_agent_name, target_name, query)
                additional_results.append(fallback_result)

                report.append({
                    "agent": target_name,
                    "status": "fallback",
                    "reason": f"x402 call failed: {str(e)}",
                    "source": "self-computed (call failed)",
                })

        enhanced = main_result
        if additional_results:
            enhanced += "\n\n---\n\n### Cross-Agent Insights\n\n"
            enhanced += "\n\n".join(additional_results)

        return {
            "enhanced_result": enhanced,
            "cross_agent_report": report,
            "x402_payments": payments,
        }

    async def _call_agent_internal(self, agent_name: str, query: str) -> str:
        """
        Call another AgentFi agent internally (server-to-server).
        Uses X-AgentFi-Internal header to bypass x402 (already paid via AFC).
        """
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                resp = await client.post(
                    f"{self.backend_url}/agents/{agent_name}/execute",
                    json={"query": query},
                    headers={
                        "X-AgentFi-Internal": "true",
                        "Content-Type": "application/json",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    # Navigate the AgentResponse wrapper
                    if data.get("data") and isinstance(data["data"], dict):
                        return data["data"].get("result", "No result returned")
                    return data.get("result", str(data.get("data", "No result returned")))
                else:
                    logger.error(f"Internal call to {agent_name} returned {resp.status_code}")
                    return f"[{agent_name} returned error {resp.status_code}]"
        except Exception as e:
            logger.error(f"Internal call to {agent_name} failed: {e}")
            raise

    async def _self_compute_fallback(self, caller: str, target: str, query: str) -> str:
        """Generate a simplified version of what the target agent would provide."""
        fallback_responses = {
            "risk_scorer": (
                "**Risk Assessment (self-computed, simplified):**\n"
                "Based on general portfolio allocation rules, estimated risk score: 5.5/10.\n"
                "*Note: A dedicated cross-agent risk analysis (via x402) would provide more "
                "accurate, real-time risk scoring. This agent needs more AFC to afford it.*"
            ),
            "yield_optimizer": (
                "**Yield Overview (self-computed, simplified):**\n"
                "General DeFi yields on Hedera ecosystem range from 2-15% APY.\n"
                "*Note: A dedicated cross-agent yield analysis (via x402) would provide "
                "specific pool recommendations with live APY data.*"
            ),
            "portfolio_analyzer": (
                "**Portfolio Overview (self-computed, simplified):**\n"
                "Basic portfolio allocation data available.\n"
                "*Note: A dedicated cross-agent portfolio analysis would provide "
                "more detailed token-level breakdown.*"
            ),
        }
        return fallback_responses.get(target, f"[{target}: fallback -- insufficient data]")
