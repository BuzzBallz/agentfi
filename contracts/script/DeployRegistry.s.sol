// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";

contract DeployRegistry is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address agentNFTv2 = vm.envAddress("AGENT_NFT_V2_ADDRESS");

        console.log("AgentNFTv2 address:", agentNFTv2);

        vm.startBroadcast(deployerPrivateKey);
        AgentRegistry registry = new AgentRegistry(agentNFTv2);
        vm.stopBroadcast();

        console.log("AgentRegistry deployed at:", address(registry));
    }
}
