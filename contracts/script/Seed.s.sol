// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentNFT.sol";
import "../src/AgentMarketplace.sol";

contract Seed is Script {
    function run() external {
        address nftAddr = vm.envAddress("OG_NFT_ADDRESS");
        address marketAddr = vm.envAddress("OG_MARKETPLACE_ADDRESS");

        AgentNFT agentNFT = AgentNFT(nftAddr);
        AgentMarketplace marketplace = AgentMarketplace(marketAddr);

        vm.startBroadcast();

        // --- Agent 0: Portfolio Analyzer ---
        AgentNFT.AgentMetadata memory meta0 = AgentNFT.AgentMetadata({
            modelHash: "QmPortfolioAnalyzerV1",
            systemPrompt: "You are a DeFi portfolio analyzer. Analyze token holdings, calculate allocation percentages, and identify concentration risks.",
            capabilities: '["portfolio_analysis","token_tracking","allocation_report"]',
            pricePerCall: 0.001 ether
        });
        uint256 id0 = agentNFT.mint(msg.sender, "https://agentfi.xyz/metadata/0", meta0);
        marketplace.listAgent(id0, 0.001 ether);
        console.log("Agent 0 (Portfolio Analyzer) minted and listed, tokenId:", id0);

        // --- Agent 1: Yield Optimizer ---
        AgentNFT.AgentMetadata memory meta1 = AgentNFT.AgentMetadata({
            modelHash: "QmYieldOptimizerV1",
            systemPrompt: "You are a DeFi yield optimizer. Find the best yield farming opportunities across protocols and suggest optimal allocation strategies.",
            capabilities: '["yield_farming","protocol_comparison","apy_calculation"]',
            pricePerCall: 0.001 ether
        });
        uint256 id1 = agentNFT.mint(msg.sender, "https://agentfi.xyz/metadata/1", meta1);
        marketplace.listAgent(id1, 0.001 ether);
        console.log("Agent 1 (Yield Optimizer) minted and listed, tokenId:", id1);

        // --- Agent 2: Risk Scorer ---
        AgentNFT.AgentMetadata memory meta2 = AgentNFT.AgentMetadata({
            modelHash: "QmRiskScorerV1",
            systemPrompt: "You are a DeFi risk scorer. Evaluate portfolio risk across dimensions: volatility, impermanent loss, smart contract risk, and liquidity risk.",
            capabilities: '["risk_assessment","volatility_analysis","safety_scoring"]',
            pricePerCall: 0.0005 ether
        });
        uint256 id2 = agentNFT.mint(msg.sender, "https://agentfi.xyz/metadata/2", meta2);
        marketplace.listAgent(id2, 0.0005 ether);
        console.log("Agent 2 (Risk Scorer) minted and listed, tokenId:", id2);

        vm.stopBroadcast();
    }
}
