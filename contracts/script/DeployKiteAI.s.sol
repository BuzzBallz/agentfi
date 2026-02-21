// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/KiteAgentFiService.sol";

contract DeployKiteAI is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");

        vm.startBroadcast(deployerPrivateKey);

        KiteAgentFiService service = new KiteAgentFiService();

        // Register all 3 AgentFi agents as x402 services
        service.registerService(
            "AgentFi Portfolio Analyzer",
            "/agents/portfolio_analyzer/execute",
            10000, // 0.01 USDT
            "Autonomous DeFi portfolio analysis with real-time CoinGecko data"
        );

        service.registerService(
            "AgentFi Yield Optimizer",
            "/agents/yield_optimizer/execute",
            15000, // 0.015 USDT
            "Multi-protocol yield optimization across Hedera and Ethereum DeFi"
        );

        service.registerService(
            "AgentFi Risk Scorer",
            "/agents/risk_scorer/execute",
            5000, // 0.005 USDT
            "Deterministic portfolio risk scoring with volatility analysis"
        );

        vm.stopBroadcast();

        console.log("KiteAgentFiService deployed at:", address(service));
        console.log("3 agent services registered");
    }
}
