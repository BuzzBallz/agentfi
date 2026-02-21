import { Wallet, Provider } from "zksync-ethers";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Deployer } from "@matterlabs/hardhat-zksync-deploy";
import * as dotenv from "dotenv";

dotenv.config();

export default async function (hre: HardhatRuntimeEnvironment) {
    console.log("=== Deploying AgentFi Compliance Layer to ADI Testnet ===\n");

    const provider = new Provider("https://rpc.ab.testnet.adifoundation.ai/");
    const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);
    const deployer = new Deployer(hre, wallet);

    console.log(`Deployer address: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${hre.ethers.formatEther(balance)} ADI\n`);

    // ─── Step 1: Deploy ADIAgentPayments ───────────────────
    console.log("1. Deploying ADIAgentPayments...");
    const paymentsArtifact = await deployer.loadArtifact("ADIAgentPayments");
    const payments = await deployer.deploy(paymentsArtifact, [
        wallet.address,     // treasury
        wallet.address,     // compliance officer
    ], undefined, {
        gasLimit: 10_000_000n,
    });
    const paymentsAddress = await payments.getAddress();
    console.log(`   ADIAgentPayments deployed at: ${paymentsAddress}`);

    // ─── Step 2: Deploy AgentFiPaymaster ──────────────────
    const ENTRY_POINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
    const MAX_DAILY_GAS = hre.ethers.parseEther("0.1");

    console.log("\n2. Deploying AgentFiPaymaster...");
    const paymasterArtifact = await deployer.loadArtifact("AgentFiPaymaster");
    const paymaster = await deployer.deploy(paymasterArtifact, [
        ENTRY_POINT_V07,
        paymentsAddress,
        MAX_DAILY_GAS,
    ], undefined, {
        gasLimit: 10_000_000n,
    });
    const paymasterAddress = await paymaster.getAddress();
    console.log(`   AgentFiPaymaster deployed at: ${paymasterAddress}`);

    // ─── Step 3: Register Agent Services ──────────────────
    console.log("\n3. Registering agent services...");

    const agents = [
        { name: "portfolio_analyzer", price: hre.ethers.parseEther("0.01"), desc: "Autonomous DeFi portfolio analysis — 17 on-chain tools, multi-chain data", minTier: 1 },
        { name: "yield_optimizer", price: hre.ethers.parseEther("0.015"), desc: "SaucerSwap + Bonzo Finance yield optimization on Hedera ecosystem", minTier: 1 },
        { name: "risk_scorer", price: hre.ethers.parseEther("0.005"), desc: "Real-time portfolio risk scoring with volatility and concentration analysis", minTier: 1 },
    ];

    for (const agent of agents) {
        const tx = await payments.registerAgentService(agent.name, agent.price, agent.desc, agent.minTier);
        await tx.wait();
        console.log(`   ${agent.name} registered at ${hre.ethers.formatEther(agent.price)} ADI`);
    }

    // ─── Step 4: KYC the deployer wallet (for demo) ──────
    console.log("\n4. KYC-verifying deployer wallet (for demo purposes)...");
    const kycTx = await payments.verifyKYC(
        wallet.address, "AE", 3, "0x" + "a".repeat(64),
    );
    await kycTx.wait();
    console.log("   Deployer KYC-verified: UAE, Tier 3 (Institutional)");

    // ─── Step 5: Execute a demo payment ───────────────────
    console.log("\n5. Executing demo compliant payment...");
    const payTx = await payments.payForAgentService(0, {
        value: hre.ethers.parseEther("0.01"),
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

    console.log("DEPLOYMENTS_JSON:");
    console.log(JSON.stringify({
        ADIAgentPayments: paymentsAddress,
        AgentFiPaymaster: paymasterAddress,
        entryPoint: ENTRY_POINT_V07,
    }));
}
