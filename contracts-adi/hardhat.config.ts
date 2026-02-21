import { HardhatUserConfig } from "hardhat/config";
import "@matterlabs/hardhat-zksync";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config();

const config: HardhatUserConfig = {
    zksolc: {
        settings: {
            compilerPath: path.join(process.env.USERPROFILE || process.env.HOME || "", ".zksolc", "zksolc-v1.5.12.exe"),
            codegen: "evmla",
            missingLibrariesPath: "./.zksolc-libraries-cache/missingLibraryDependencies.json",
        },
    },
    defaultNetwork: "adiTestnet",
    networks: {
        adiTestnet: {
            url: "https://rpc.ab.testnet.adifoundation.ai/",
            ethNetwork: "sepolia",
            zksync: true,
            chainId: 99999,
            accounts: process.env.DEPLOYER_PRIVATE_KEY
                ? [process.env.DEPLOYER_PRIVATE_KEY]
                : [],
        },
        hardhat: {
            zksync: true,
        },
    },
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    paths: {
        sources: "./contracts",
        artifacts: "./artifacts",
        cache: "./cache",
    },
};

export default config;
