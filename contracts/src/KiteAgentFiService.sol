// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title KiteAgentFiService
 * @notice Registers AgentFi's AI agents as x402-compatible services on KiteAI.
 * @dev Deployed on KiteAI testnet (chain 2368) to demonstrate x402 integration.
 *      External agents on KiteAI can discover AgentFi services and pay via USDT.
 */
contract KiteAgentFiService {
    struct AgentService {
        string name;
        string endpoint;
        uint256 priceUSDT; // 6 decimals — 10000 = 0.01 USDT
        bool active;
        string description;
    }

    address public owner;
    mapping(uint256 => AgentService) public services;
    uint256 public serviceCount;

    event ServiceRegistered(uint256 indexed serviceId, string name, uint256 priceUSDT);
    event ServiceUpdated(uint256 indexed serviceId, bool active);
    event PaymentReceived(uint256 indexed serviceId, address indexed payer, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerService(
        string calldata name,
        string calldata endpoint,
        uint256 priceUSDT,
        string calldata description
    ) external onlyOwner returns (uint256 serviceId) {
        serviceId = serviceCount++;
        services[serviceId] = AgentService({
            name: name,
            endpoint: endpoint,
            priceUSDT: priceUSDT,
            active: true,
            description: description
        });
        emit ServiceRegistered(serviceId, name, priceUSDT);
    }

    function setServiceActive(uint256 serviceId, bool active) external onlyOwner {
        services[serviceId].active = active;
        emit ServiceUpdated(serviceId, active);
    }

    function getActiveServices()
        external
        view
        returns (uint256[] memory ids, AgentService[] memory activeServices)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < serviceCount; i++) {
            if (services[i].active) count++;
        }

        ids = new uint256[](count);
        activeServices = new AgentService[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < serviceCount; i++) {
            if (services[i].active) {
                ids[idx] = i;
                activeServices[idx] = services[i];
                idx++;
            }
        }
    }

    function recordPayment(uint256 serviceId, address payer, uint256 amount) external onlyOwner {
        emit PaymentReceived(serviceId, payer, amount);
    }
}
