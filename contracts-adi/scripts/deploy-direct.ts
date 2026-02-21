import { Wallet, Provider, ContractFactory, utils } from "zksync-ethers";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

async function main() {
    console.log("=== Deploying AgentFi Compliance Layer to ADI Testnet ===\n");

    const provider = new Provider("https://rpc.ab.testnet.adifoundation.ai/");
    const wallet = new Wallet(process.env.DEPLOYER_PRIVATE_KEY!, provider);

    console.log(`Deployer address: ${wallet.address}`);
    const balance = await provider.getBalance(wallet.address);
    console.log(`Balance: ${(Number(balance) / 1e18).toFixed(4)} ADI\n`);

    // Load compiled artifacts
    const paymentsArtifact = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "../artifacts-zk/contracts/ADIAgentPayments.sol/ADIAgentPayments.json"), "utf-8")
    );
    const paymasterArtifact = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, "../artifacts-zk/contracts/AgentFiPaymaster.sol/AgentFiPaymaster.json"), "utf-8")
    );

    // ─── Step 1: Deploy ADIAgentPayments ───────────────────
    console.log("1. Deploying ADIAgentPayments...");
    const paymentsFactory = new ContractFactory(
        paymentsArtifact.abi,
        paymentsArtifact.bytecode,
        wallet,
    );
    const payments = await paymentsFactory.deploy(wallet.address, wallet.address) as any;
    await payments.waitForDeployment();
    const paymentsAddress = await payments.getAddress();
    console.log(`   ADIAgentPayments deployed at: ${paymentsAddress}`);

    // ─── Step 2: Deploy AgentFiPaymaster ──────────────────
    const ENTRY_POINT_V07 = "0x0000000071727De22E5E9d8BAf0edAc6f37da032";
    const MAX_DAILY_GAS = BigInt("100000000000000000"); // 0.1 ADI

    console.log("\n2. Deploying AgentFiPaymaster...");
    const paymasterFactory = new ContractFactory(
        paymasterArtifact.abi,
        paymasterArtifact.bytecode,
        wallet,
    );
    const paymaster = await paymasterFactory.deploy(ENTRY_POINT_V07, paymentsAddress, MAX_DAILY_GAS) as any;
    await paymaster.waitForDeployment();
    const paymasterAddress = await paymaster.getAddress();
    console.log(`   AgentFiPaymaster deployed at: ${paymasterAddress}`);

    // ─── Step 3: Register Agent Services ──────────────────
    console.log("\n3. Registering agent services...");

    const agents = [
        { name: "portfolio_analyzer", price: BigInt("10000000000000000"), desc: "Autonomous DeFi portfolio analysis — 17 on-chain tools, multi-chain data", minTier: 1 },
        { name: "yield_optimizer", price: BigInt("15000000000000000"), desc: "SaucerSwap + Bonzo Finance yield optimization on Hedera ecosystem", minTier: 1 },
        { name: "risk_scorer", price: BigInt("5000000000000000"), desc: "Real-time portfolio risk scoring with volatility and concentration analysis", minTier: 1 },
    ];

    for (const agent of agents) {
        const tx = await payments.registerAgentService(agent.name, agent.price, agent.desc, agent.minTier);
        await tx.wait();
        console.log(`   ${agent.name} registered at ${Number(agent.price) / 1e18} ADI`);
    }

    // ─── Step 4: KYC the deployer wallet ──────────────────
    console.log("\n4. KYC-verifying deployer wallet (for demo)...");
    const kycTx = await payments.verifyKYC(
        wallet.address, "AE", 3, "0x" + "a".repeat(64),
    );
    await kycTx.wait();
    console.log("   Deployer KYC-verified: UAE, Tier 3 (Institutional)");

    // ─── Step 5: Execute a demo payment ───────────────────
    console.log("\n5. Executing demo compliant payment...");
    const payTx = await payments.payForAgentService(0, {
        value: BigInt("10000000000000000"), // 0.01 ADI
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
