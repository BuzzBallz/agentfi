import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
    defaultNetwork: "adiTestnet",
    networks: {
        adiTestnet: {
            url: "https://rpc.ab.testnet.adifoundation.ai/",
            chainId: 99999,
            accounts: process.env.DEPLOYER_PRIVATE_KEY
                ? [process.env.DEPLOYER_PRIVATE_KEY]
                : [],
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
        artifacts: "./artifacts-evm",
        cache: "./cache-evm",
    },
};

export default config;
