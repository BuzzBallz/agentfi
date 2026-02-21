import { ethers } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    console.log("=== Deploying AgentFi Compliance Layer to ADI Testnet (EVM mode) ===\n");

    const [deployer] = await ethers.getSigners();
    console.log(`Deployer address: ${deployer.address}`);
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`Balance: ${ethers.formatEther(balance)} ADI\n`);

    // ─── Step 1: Deploy ADIAgentPayments ───────────────────
    console.log("1. Deploying ADIAgentPayments...");
    const PaymentsFactory = await ethers.getContractFactory("ADIAgentPayments");
    const payments = await PaymentsFactory.deploy(deployer.address, deployer.address);
    await payments.waitForDeployment();
    const paymentsAddress = await payments.getAddress();
    console.log(`   ADIAgentPayments deployed at: ${paymentsAddress}`);

    // ─── Step 2: Deploy AgentFiPaymaster ──────────────────
    const ENTRY_POINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
    const MAX_DAILY_GAS = ethers.parseEther("0.1");

    console.log("\n2. Deploying AgentFiPaymaster...");
    const PaymasterFactory = await ethers.getContractFactory("AgentFiPaymaster");
    const paymaster = await PaymasterFactory.deploy(ENTRY_POINT_V07, paymentsAddress, MAX_DAILY_GAS);
    await paymaster.waitForDeployment();
    const paymasterAddress = await paymaster.getAddress();
    console.log(`   AgentFiPaymaster deployed at: ${paymasterAddress}`);

    // ─── Step 3: Register Agent Services ──────────────────
    console.log("\n3. Registering agent services...");

    const agents = [
        { name: "portfolio_analyzer", price: ethers.parseEther("0.01"), desc: "Autonomous DeFi portfolio analysis — 17 on-chain tools, multi-chain data", minTier: 1 },
        { name: "yield_optimizer", price: ethers.parseEther("0.015"), desc: "SaucerSwap + Bonzo Finance yield optimization on Hedera ecosystem", minTier: 1 },
        { name: "risk_scorer", price: ethers.parseEther("0.005"), desc: "Real-time portfolio risk scoring with volatility and concentration analysis", minTier: 1 },
    ];

    for (const agent of agents) {
        const tx = await payments.registerAgentService(agent.name, agent.price, agent.desc, agent.minTier);
        await tx.wait();
        console.log(`   ${agent.name} registered at ${ethers.formatEther(agent.price)} ADI`);
    }

    // ─── Step 4: KYC the deployer wallet ──────────────────
    console.log("\n4. KYC-verifying deployer wallet (for demo)...");
    const kycTx = await payments.verifyKYC(
        deployer.address, "AE", 3, "0x" + "a".repeat(64),
    );
    await kycTx.wait();
    console.log("   Deployer KYC-verified: UAE, Tier 3 (Institutional)");

    // ─── Step 5: Execute a demo payment ───────────────────
    console.log("\n5. Executing demo compliant payment...");
    const payTx = await payments.payForAgentService(0, {
        value: ethers.parseEther("0.01"),
    });
    const payReceipt = await payTx.wait();
    console.log(`   Payment recorded. TX: ${payReceipt?.hash}`);

    // ─── Step 6: Record execution receipt ─────────────────
    console.log("\n6. Recording execution receipt with Hedera cross-chain link...");
    const receiptTx = await payments.recordExecutionReceipt(
        0, "0.0.7977799", "0x" + "b".repeat(64),
    );
    await receiptTx.wait();
    console.log("   Execution receipt recorded with Hedera HCS link");

    // ─── Summary ──────────────────────────────────────────
    console.log("\n\n========================================");
    console.log("  DEPLOYMENT COMPLETE — ADI TESTNET");
    console.log("========================================");
    console.log(`  ADIAgentPayments:  ${paymentsAddress}`);
    console.log(`  AgentFiPaymaster:  ${paymasterAddress}`);
    console.log(`  Chain:             ADI Testnet (99999)`);
    console.log(`  Explorer:          https://explorer.ab.testnet.adifoundation.ai/`);
    console.log(`  Services:          3 agents registered`);
    console.log(`  KYC Users:         1 (deployer — demo)`);
    console.log(`  Demo Payment:      1 (0.01 ADI — portfolio_analyzer)`);
    console.log("========================================\n");

    console.log("DEPLOYMENTS_JSON:" + JSON.stringify({
        ADIAgentPayments: paymentsAddress,
        AgentFiPaymaster: paymasterAddress,
        entryPoint: ENTRY_POINT_V07,
    }));
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
