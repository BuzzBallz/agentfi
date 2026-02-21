// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";

contract SeedRegistry is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address registryAddr = vm.envAddress("AGENT_REGISTRY_ADDRESS");
        string memory operatorHederaAccount =
            vm.envOr("HEDERA_OPERATOR_ACCOUNT", string("0.0.7973940"));

        AgentRegistry registry = AgentRegistry(registryAddr);

        vm.startBroadcast(deployerPrivateKey);

        // ─── Agent 0: Portfolio Analyzer ───
        registry.setHederaAccounts(0, "0.0.7977799", operatorHederaAccount);
        registry.setX402Config(
            0,
            AgentRegistry.X402Config({
                enabled: true,
                priceAFC: 100, // 1.00 AFC
                priceUSDT: 10000, // 0.01 USDT
                maxBudgetAFC: 500, // 5.00 AFC max spend
                allowCrossAgent: true
            })
        );
        console.log("Agent 0 (Portfolio Analyzer) configured");

        // ─── Agent 1: Yield Optimizer ───
        registry.setHederaAccounts(1, "0.0.7977811", operatorHederaAccount);
        registry.setX402Config(
            1,
            AgentRegistry.X402Config({
                enabled: true,
                priceAFC: 150, // 1.50 AFC
                priceUSDT: 15000, // 0.015 USDT
                maxBudgetAFC: 300, // 3.00 AFC max spend
                allowCrossAgent: true
            })
        );
        console.log("Agent 1 (Yield Optimizer) configured");

        // ─── Agent 2: Risk Scorer ───
        registry.setHederaAccounts(2, "0.0.7977819", operatorHederaAccount);
        registry.setX402Config(
            2,
            AgentRegistry.X402Config({
                enabled: true,
                priceAFC: 50, // 0.50 AFC
                priceUSDT: 5000, // 0.005 USDT
                maxBudgetAFC: 200, // 2.00 AFC max spend
                allowCrossAgent: false
            })
        );
        console.log("Agent 2 (Risk Scorer) configured");

        vm.stopBroadcast();
    }
}
