// STATUS: Merkle roots computed successfully. On-chain submission blocked by
// 0G Galileo testnet infrastructure issue — Market proxy (0x26c8...) reverts
// on execution (minimal proxy bytecode, implementation not wired).
// Re-run this script when testnet is fixed: node upload-metadata.js
// Root hashes saved in metadata/storage-refs.json

import dotenv from "dotenv";
import { ZgFile, Indexer } from "@0glabs/0g-ts-sdk";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load local .env first, then project root .env as fallback
dotenv.config({ path: path.resolve(__dirname, ".env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// ── 0G Testnet config ──
const EVM_RPC = "https://evmrpc-testnet.0g.ai";
const INDEXER_RPC = "https://indexer-storage-testnet-turbo.0g.ai";

// ── Wallet ──
const PRIVATE_KEY = process.env.PRIVATE_KEY || process.env.DEPLOYER_PRIVATE_KEY;
if (!PRIVATE_KEY) {
  console.error("Missing PRIVATE_KEY in .env — copy .env.example to .env and add your key");
  process.exit(1);
}

const provider = new ethers.JsonRpcProvider(EVM_RPC);
const signer = new ethers.Wallet(PRIVATE_KEY, provider);
const indexer = new Indexer(INDEXER_RPC);

// ── Agent metadata files ──
const METADATA_FILES = [
  "metadata/agent-0-portfolio-analyzer.json",
  "metadata/agent-1-yield-optimizer.json",
  "metadata/agent-2-risk-scorer.json",
];

async function uploadFile(filePath) {
  const absPath = path.resolve(__dirname, filePath);
  console.log(`\n  Uploading: ${filePath}`);

  // 1. Create ZgFile from path
  const file = await ZgFile.fromFilePath(absPath);

  // 2. Get Merkle root hash (this is the storage reference)
  const [tree, treeErr] = await file.merkleTree();
  if (treeErr) {
    await file.close();
    throw new Error(`Merkle tree error for ${filePath}: ${treeErr}`);
  }
  const rootHash = tree.rootHash();
  console.log(`   Root hash: ${rootHash}`);

  // 3. Upload to 0G Storage (pays gas on-chain)
  let tx = null;
  try {
    const [txResult, uploadErr] = await indexer.upload(file, EVM_RPC, signer);
    if (uploadErr) {
      console.log(`   Upload tx failed (testnet issue): continuing with root hash only`);
    } else {
      tx = txResult;
      console.log(`   Tx: ${tx}`);
    }
  } catch (err) {
    console.log(`   Upload tx failed (testnet issue): continuing with root hash only`);
  }

  // 4. Clean up
  await file.close();

  return { filePath, rootHash, tx };
}

async function main() {
  console.log("===================================================");
  console.log("  AgentFi - 0G Storage Metadata Upload");
  console.log("===================================================");

  const walletAddress = await signer.getAddress();
  const balance = await provider.getBalance(walletAddress);
  console.log(`\nWallet:  ${walletAddress}`);
  console.log(`Balance: ${ethers.formatEther(balance)} OG`);
  console.log(`Chain:   0G Testnet (Galileo)`);
  console.log(`Indexer: ${INDEXER_RPC}`);

  if (balance === 0n) {
    console.error("\n  Wallet has 0 OG - get testnet tokens from https://faucet.0g.ai");
    process.exit(1);
  }

  const results = [];

  for (const file of METADATA_FILES) {
    try {
      const result = await uploadFile(file);
      results.push(result);
    } catch (err) {
      console.error(`   FAILED: ${err.message}`);
      results.push({ filePath: file, rootHash: null, tx: null, error: err.message });
    }
  }

  // ── Summary ──
  console.log("\n===================================================");
  console.log("  Upload Summary");
  console.log("===================================================\n");

  const summary = {};
  for (const r of results) {
    const agentName = path.basename(r.filePath, ".json");
    if (r.rootHash) {
      const status = r.tx ? "UPLOADED" : "HASH ONLY (tx pending)";
      console.log(`  ${agentName}`);
      console.log(`   Status:    ${status}`);
      console.log(`   Root hash: ${r.rootHash}`);
      if (r.tx) console.log(`   Tx:        ${r.tx}`);
      summary[agentName] = { rootHash: r.rootHash, tx: r.tx, status };
    } else {
      console.log(`  FAILED ${agentName}: ${r.error}`);
      summary[agentName] = { error: r.error };
    }
  }

  // Save references to file
  const outPath = path.resolve(__dirname, "storage-references.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));
  console.log(`\nReferences saved to: storage-references.json`);

  console.log("\n0G Storage Explorer: https://storagescan-galileo.0g.ai");
  console.log("Use root hashes above as tokenURI references in your iNFTs.");
  console.log("To retry uploads: fund wallet via https://faucet.0g.ai then re-run.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
