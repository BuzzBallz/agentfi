// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title ADIAgentPayments
 * @notice Compliant payment gateway for AgentFi AI agents on ADI Chain.
 * @dev Implements:
 *   - KYC whitelist gating (FATF/ADGM compliance)
 *   - $ADI native token payments for agent services
 *   - FATF Travel Rule metadata recording per transaction
 *   - On-chain audit trail for regulatory verification
 *   - Cross-chain execution receipts (links to Hedera HCS proofs)
 *
 * Architecture: This is a SEPARATE payment path alongside the permissionless
 * 0G Chain marketplace. Users choose which mode to use. Same agents, different
 * compliance posture.
 *
 * Bounty targets: ADI Open Project ($19k) + Payments Component for Merchants ($3k)
 */
contract ADIAgentPayments {

    // ─── State ─────────────────────────────────────────────
    address public owner;
    address public complianceOfficer;
    address public agentFiTreasury;

    // KYC Whitelist
    mapping(address => bool) public kycVerified;
    mapping(address => KYCData) public kycRecords;
    uint256 public totalKYCUsers;

    // Agent Services (mirrors AgentFi marketplace on 0G chain)
    mapping(uint256 => AgentService) public agentServices;
    uint256 public serviceCount;

    // Payment Records (Travel Rule compliant)
    mapping(uint256 => PaymentRecord) public paymentRecords;
    uint256 public paymentCount;
    mapping(address => uint256[]) public userPaymentHistory;

    // Compliance Statistics
    uint256 public totalVolumeADI;
    uint256 public totalPayments;

    // ─── Structs ───────────────────────────────────────────

    struct KYCData {
        bool verified;
        string jurisdiction;        // ISO 3166-1 alpha-2 (e.g., "AE", "SG", "NG")
        uint256 verifiedAt;
        uint256 tier;               // 1 = basic, 2 = enhanced, 3 = institutional
        string complianceHash;      // Hash of off-chain KYC docs (privacy preserving)
    }

    struct AgentService {
        string agentName;
        uint256 priceADI;           // Price in ADI wei (18 decimals)
        bool active;
        string description;
        uint256 minKYCTier;         // Minimum KYC tier required (0 = any verified user)
        uint256 totalExecutions;
    }

    /**
     * @notice FATF Travel Rule compliant payment record.
     * Records originator, beneficiary, amount, and purpose for each transaction.
     */
    struct PaymentRecord {
        address originator;
        string originatorJurisdiction;
        uint256 originatorKYCTier;
        address beneficiary;
        string beneficiaryName;
        uint256 amount;
        uint256 timestamp;
        uint256 agentServiceId;
        string agentName;
        string hederaTopicId;
        string executionHash;
        string purposeOfPayment;
        PaymentStatus status;
    }

    enum PaymentStatus {
        PENDING,
        COMPLETED,
        REFUNDED
    }

    // ─── Events (Audit Trail) ──────────────────────────────

    event KYCVerified(
        address indexed user,
        string jurisdiction,
        uint256 tier,
        uint256 timestamp
    );

    event KYCRevoked(address indexed user, uint256 timestamp);

    event AgentServiceRegistered(
        uint256 indexed serviceId,
        string agentName,
        uint256 priceADI
    );

    event CompliancePayment(
        uint256 indexed paymentId,
        address indexed originator,
        string originatorJurisdiction,
        uint256 amount,
        uint256 indexed agentServiceId,
        string agentName,
        uint256 timestamp
    );

    event ExecutionReceipt(
        uint256 indexed paymentId,
        string hederaTopicId,
        string executionHash,
        PaymentStatus status
    );

    event TravelRuleRecord(
        uint256 indexed paymentId,
        address indexed originator,
        string originatorJurisdiction,
        address beneficiary,
        string beneficiaryName,
        uint256 amount,
        string purposeOfPayment
    );

    // ─── Modifiers ─────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ADIAgentPayments: caller is not owner");
        _;
    }

    modifier onlyCompliance() {
        require(
            msg.sender == complianceOfficer || msg.sender == owner,
            "ADIAgentPayments: caller is not compliance officer"
        );
        _;
    }

    modifier onlyKYCVerified() {
        require(kycVerified[msg.sender], "ADIAgentPayments: user not KYC verified");
        _;
    }

    // ─── Constructor ───────────────────────────────────────

    constructor(address _treasury, address _complianceOfficer) {
        owner = msg.sender;
        agentFiTreasury = _treasury;
        complianceOfficer = _complianceOfficer;
    }

    // ─── KYC Management ────────────────────────────────────

    function verifyKYC(
        address user,
        string calldata jurisdiction,
        uint256 tier,
        string calldata complianceHash
    ) external onlyCompliance {
        require(user != address(0), "ADIAgentPayments: zero address");
        require(tier >= 1 && tier <= 3, "ADIAgentPayments: invalid tier");
        require(bytes(jurisdiction).length == 2, "ADIAgentPayments: invalid jurisdiction code");

        bool wasVerified = kycVerified[user];

        kycVerified[user] = true;
        kycRecords[user] = KYCData({
            verified: true,
            jurisdiction: jurisdiction,
            verifiedAt: block.timestamp,
            tier: tier,
            complianceHash: complianceHash
        });

        if (!wasVerified) {
            totalKYCUsers++;
        }

        emit KYCVerified(user, jurisdiction, tier, block.timestamp);
    }

    function revokeKYC(address user) external onlyCompliance {
        kycVerified[user] = false;
        kycRecords[user].verified = false;
        emit KYCRevoked(user, block.timestamp);
    }

    function batchVerifyKYC(
        address[] calldata users,
        string[] calldata jurisdictions,
        uint256[] calldata tiers,
        string[] calldata complianceHashes
    ) external onlyCompliance {
        require(
            users.length == jurisdictions.length &&
            users.length == tiers.length &&
            users.length == complianceHashes.length,
            "ADIAgentPayments: array length mismatch"
        );

        for (uint256 i = 0; i < users.length; i++) {
            if (!kycVerified[users[i]]) {
                totalKYCUsers++;
            }
            kycVerified[users[i]] = true;
            kycRecords[users[i]] = KYCData({
                verified: true,
                jurisdiction: jurisdictions[i],
                verifiedAt: block.timestamp,
                tier: tiers[i],
                complianceHash: complianceHashes[i]
            });
            emit KYCVerified(users[i], jurisdictions[i], tiers[i], block.timestamp);
        }
    }

    // ─── Agent Service Registration ────────────────────────

    function registerAgentService(
        string calldata agentName,
        uint256 priceADI,
        string calldata description,
        uint256 minKYCTier
    ) external onlyOwner returns (uint256 serviceId) {
        serviceId = serviceCount++;
        agentServices[serviceId] = AgentService({
            agentName: agentName,
            priceADI: priceADI,
            active: true,
            description: description,
            minKYCTier: minKYCTier,
            totalExecutions: 0
        });

        emit AgentServiceRegistered(serviceId, agentName, priceADI);
    }

    function updateAgentService(
        uint256 serviceId,
        uint256 newPriceADI,
        bool active
    ) external onlyOwner {
        require(serviceId < serviceCount, "ADIAgentPayments: invalid service");
        agentServices[serviceId].priceADI = newPriceADI;
        agentServices[serviceId].active = active;
    }

    // ─── Payment Flow (The Core) ───────────────────────────

    function payForAgentService(
        uint256 serviceId
    ) external payable onlyKYCVerified returns (uint256 paymentId) {
        AgentService storage service = agentServices[serviceId];

        require(service.active, "ADIAgentPayments: service not active");
        require(msg.value >= service.priceADI, "ADIAgentPayments: insufficient payment");
        require(
            kycRecords[msg.sender].tier >= service.minKYCTier,
            "ADIAgentPayments: KYC tier too low"
        );

        // Refund excess first (checks-effects-interactions)
        uint256 excess = msg.value - service.priceADI;

        // Create compliant payment record
        paymentId = paymentCount++;
        KYCData storage kyc = kycRecords[msg.sender];

        paymentRecords[paymentId] = PaymentRecord({
            originator: msg.sender,
            originatorJurisdiction: kyc.jurisdiction,
            originatorKYCTier: kyc.tier,
            beneficiary: agentFiTreasury,
            beneficiaryName: "AgentFi Protocol",
            amount: service.priceADI,
            timestamp: block.timestamp,
            agentServiceId: serviceId,
            agentName: service.agentName,
            hederaTopicId: "",
            executionHash: "",
            purposeOfPayment: "AI Agent DeFi Analysis Service",
            status: PaymentStatus.PENDING
        });

        userPaymentHistory[msg.sender].push(paymentId);

        // Update statistics
        service.totalExecutions++;
        totalVolumeADI += service.priceADI;
        totalPayments++;

        // Emit compliance events
        emit CompliancePayment(
            paymentId,
            msg.sender,
            kyc.jurisdiction,
            service.priceADI,
            serviceId,
            service.agentName,
            block.timestamp
        );

        emit TravelRuleRecord(
            paymentId,
            msg.sender,
            kyc.jurisdiction,
            agentFiTreasury,
            "AgentFi Protocol",
            service.priceADI,
            "AI Agent DeFi Analysis Service"
        );

        // Transfer $ADI to treasury
        (bool sent, ) = agentFiTreasury.call{value: service.priceADI}("");
        require(sent, "ADIAgentPayments: transfer failed");

        // Refund excess payment
        if (excess > 0) {
            (bool refunded, ) = msg.sender.call{value: excess}("");
            require(refunded, "ADIAgentPayments: refund failed");
        }
    }

    // ─── Execution Receipt (Cross-Chain) ───────────────────

    function recordExecutionReceipt(
        uint256 paymentId,
        string calldata hederaTopicId,
        string calldata executionHash
    ) external onlyOwner {
        require(paymentId < paymentCount, "ADIAgentPayments: invalid payment");
        PaymentRecord storage record = paymentRecords[paymentId];
        require(record.status == PaymentStatus.PENDING, "ADIAgentPayments: not pending");

        record.hederaTopicId = hederaTopicId;
        record.executionHash = executionHash;
        record.status = PaymentStatus.COMPLETED;

        emit ExecutionReceipt(paymentId, hederaTopicId, executionHash, PaymentStatus.COMPLETED);
    }

    function refundPayment(uint256 paymentId) external onlyOwner {
        require(paymentId < paymentCount, "ADIAgentPayments: invalid payment");
        PaymentRecord storage record = paymentRecords[paymentId];
        require(record.status == PaymentStatus.PENDING, "ADIAgentPayments: not pending");

        record.status = PaymentStatus.REFUNDED;
        emit ExecutionReceipt(paymentId, "", "", PaymentStatus.REFUNDED);
    }

    // ─── Read Functions ────────────────────────────────────

    function getUserProfile(address user) external view returns (
        bool isVerified,
        KYCData memory kyc,
        uint256 paymentHistoryCount,
        uint256[] memory payments
    ) {
        return (
            kycVerified[user],
            kycRecords[user],
            userPaymentHistory[user].length,
            userPaymentHistory[user]
        );
    }

    function getActiveServices() external view returns (
        uint256[] memory ids,
        AgentService[] memory services
    ) {
        uint256 count = 0;
        for (uint256 i = 0; i < serviceCount; i++) {
            if (agentServices[i].active) count++;
        }

        ids = new uint256[](count);
        services = new AgentService[](count);
        uint256 idx = 0;
        for (uint256 i = 0; i < serviceCount; i++) {
            if (agentServices[i].active) {
                ids[idx] = i;
                services[idx] = agentServices[i];
                idx++;
            }
        }
    }

    function getComplianceStats() external view returns (
        uint256 _totalKYCUsers,
        uint256 _totalPayments,
        uint256 _totalVolumeADI,
        uint256 _serviceCount
    ) {
        return (totalKYCUsers, totalPayments, totalVolumeADI, serviceCount);
    }

    function getPaymentRecord(uint256 paymentId) external view returns (PaymentRecord memory) {
        require(paymentId < paymentCount, "ADIAgentPayments: invalid payment");
        return paymentRecords[paymentId];
    }

    // ─── Admin ─────────────────────────────────────────────

    function setComplianceOfficer(address _officer) external onlyOwner {
        complianceOfficer = _officer;
    }

    function setTreasury(address _treasury) external onlyOwner {
        agentFiTreasury = _treasury;
    }
}
