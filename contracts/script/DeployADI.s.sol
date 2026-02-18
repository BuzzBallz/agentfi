// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentPayment.sol";

contract DeployADI is Script {
    function run() external {
        vm.startBroadcast();

        AgentPayment payment = new AgentPayment();
        console.log("AgentPayment deployed at:", address(payment));

        vm.stopBroadcast();
    }
}
