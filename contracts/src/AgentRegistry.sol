// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IAgentNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
}

/**
 * @title AgentRegistry
 * @notice On-chain registry for agent Hedera identity and x402 cross-agent payment config.
 * @dev Deployed independently alongside AgentNFTv2. Only the NFT owner can configure their agent.
 *      Used by the backend to determine pricing, budgets, and Hedera account mappings.
 */
contract AgentRegistry is Ownable {
    IAgentNFT public immutable agentNFT;

    // ─── Hedera Identity ───────────────────────────────────
    mapping(uint256 => string) public agentHederaAccounts;
    mapping(uint256 => string) public ownerHederaAccounts;

    // ─── x402 Configuration ────────────────────────────────
    struct X402Config {
        bool enabled;
        uint256 priceAFC; // centièmes (100 = 1.00 AFC)
        uint256 priceUSDT; // USDT wei (10000 = 0.01 USDT with 6 decimals)
        uint256 maxBudgetAFC; // centièmes
        bool allowCrossAgent;
    }

    mapping(uint256 => X402Config) public x402Configs;

    // ─── AFC Reward Rate ───────────────────────────────────
    uint256 public afcRewardRate = 100;
    uint256 public afcRewardDivisor = 1000;
    uint256 public afcMinReward = 1;

    // ─── Events ────────────────────────────────────────────
    event HederaAccountSet(
        uint256 indexed tokenId, string agentHederaAccount, string ownerHederaAccount
    );
    event X402ConfigUpdated(
        uint256 indexed tokenId,
        bool enabled,
        uint256 priceAFC,
        uint256 priceUSDT,
        uint256 maxBudgetAFC,
        bool allowCrossAgent
    );
    event AFCRewardRateUpdated(uint256 rate, uint256 divisor, uint256 minReward);

    // ─── Modifiers ─────────────────────────────────────────
    modifier onlyAgentOwner(uint256 tokenId) {
        require(
            msg.sender == agentNFT.ownerOf(tokenId), "AgentRegistry: caller is not agent owner"
        );
        _;
    }

    constructor(address _agentNFT) Ownable(msg.sender) {
        agentNFT = IAgentNFT(_agentNFT);
    }

    // ─── Hedera Identity Management ────────────────────────

    function setHederaAccounts(
        uint256 tokenId,
        string calldata _agentHederaAccount,
        string calldata _ownerHederaAccount
    ) external onlyAgentOwner(tokenId) {
        require(bytes(_agentHederaAccount).length > 0, "AgentRegistry: empty agent account");
        require(bytes(_ownerHederaAccount).length > 0, "AgentRegistry: empty owner account");

        agentHederaAccounts[tokenId] = _agentHederaAccount;
        ownerHederaAccounts[tokenId] = _ownerHederaAccount;

        emit HederaAccountSet(tokenId, _agentHederaAccount, _ownerHederaAccount);
    }

    // ─── x402 Configuration ────────────────────────────────

    function setX402Config(uint256 tokenId, X402Config calldata config)
        external
        onlyAgentOwner(tokenId)
    {
        x402Configs[tokenId] = config;
        emit X402ConfigUpdated(
            tokenId,
            config.enabled,
            config.priceAFC,
            config.priceUSDT,
            config.maxBudgetAFC,
            config.allowCrossAgent
        );
    }

    // ─── Convenience Setters ───────────────────────────────

    function setX402Enabled(uint256 tokenId, bool enabled) external onlyAgentOwner(tokenId) {
        x402Configs[tokenId].enabled = enabled;
    }

    function setX402PriceAFC(uint256 tokenId, uint256 priceAFC)
        external
        onlyAgentOwner(tokenId)
    {
        x402Configs[tokenId].priceAFC = priceAFC;
    }

    // ─── Read Helpers ──────────────────────────────────────

    function getAgentFullConfig(uint256 tokenId)
        external
        view
        returns (string memory agentHedera, string memory ownerHedera, X402Config memory config)
    {
        return (agentHederaAccounts[tokenId], ownerHederaAccounts[tokenId], x402Configs[tokenId]);
    }

    function isX402Enabled(uint256 tokenId) external view returns (bool) {
        return x402Configs[tokenId].enabled;
    }

    function calculateAFCReward(uint256 pricePerCallWei) external view returns (uint256 reward) {
        reward = (pricePerCallWei * afcRewardRate) / afcRewardDivisor;
        if (reward < afcMinReward) {
            reward = afcMinReward;
        }
    }

    // ─── Platform Admin ────────────────────────────────────

    function setAFCRewardRate(uint256 _rate, uint256 _divisor, uint256 _minReward)
        external
        onlyOwner
    {
        require(_divisor > 0, "AgentRegistry: divisor cannot be zero");
        afcRewardRate = _rate;
        afcRewardDivisor = _divisor;
        afcMinReward = _minReward;
        emit AFCRewardRateUpdated(_rate, _divisor, _minReward);
    }
}
