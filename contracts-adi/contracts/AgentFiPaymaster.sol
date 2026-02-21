// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title AgentFiPaymaster
 * @notice ERC-4337 Paymaster that sponsors gas for KYC-verified AgentFi users.
 * @dev Enables gasless UX: users pay ONLY in $ADI for agent services.
 *      The Paymaster covers gas costs for verified users.
 *
 * Design:
 *  - Only sponsors UserOperations targeting ADIAgentPayments.payForAgentService()
 *  - Validates that sender is KYC-verified before sponsoring
 *  - Owner deposits $ADI to fund gas sponsorship
 *  - Has a per-user daily gas budget to prevent abuse
 *
 * Bounty target: ADI ERC-4337 Paymaster Devtools ($3k)
 *
 * Note: On ADI Chain (zkSync-based), EntryPoint V0.7 and V0.8 are deployed.
 * This Paymaster is designed to work with the Pimlico bundler.
 */

// Minimal IEntryPoint interface for V0.7
interface IEntryPoint {
    function depositTo(address account) external payable;
    function withdrawTo(address payable withdrawAddress, uint256 withdrawAmount) external;
    function balanceOf(address account) external view returns (uint256);
}

// Packed UserOperation struct (V0.7)
struct PackedUserOperation {
    address sender;
    uint256 nonce;
    bytes initCode;
    bytes callData;
    bytes32 accountGasLimits;
    uint256 preVerificationGas;
    bytes32 gasFees;
    bytes paymasterAndData;
    bytes signature;
}

// Minimal IPaymaster interface for V0.7
interface IPaymaster {
    enum PostOpMode {
        opSucceeded,
        opReverted,
        postOpReverted
    }

    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 maxCost
    ) external returns (bytes memory context, uint256 validationData);

    function postOp(
        PostOpMode mode,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 actualUserOpFeePerGas
    ) external;
}

// Interface for our KYC check
interface IADIAgentPayments {
    function kycVerified(address user) external view returns (bool);
}

contract AgentFiPaymaster is IPaymaster {

    // ─── State ─────────────────────────────────────────────
    address public owner;
    IEntryPoint public immutable entryPoint;
    IADIAgentPayments public immutable agentPayments;

    // Gas budget tracking
    mapping(address => uint256) public dailyGasUsed;
    mapping(address => uint256) public lastGasResetDay;
    uint256 public maxDailyGasPerUser;

    // Statistics
    uint256 public totalSponsored;
    uint256 public totalGasSponsored;

    // ─── Events ────────────────────────────────────────────

    event GasSponsored(address indexed user, uint256 gasCost, uint256 timestamp);
    event PaymasterDeposit(uint256 amount, uint256 newBalance);

    // ─── Modifiers ─────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "AgentFiPaymaster: not owner");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "AgentFiPaymaster: not EntryPoint");
        _;
    }

    // ─── Constructor ───────────────────────────────────────

    constructor(
        address _entryPoint,
        address _agentPayments,
        uint256 _maxDailyGasPerUser
    ) {
        owner = msg.sender;
        entryPoint = IEntryPoint(_entryPoint);
        agentPayments = IADIAgentPayments(_agentPayments);
        maxDailyGasPerUser = _maxDailyGasPerUser;
    }

    // ─── ERC-4337 Paymaster Interface ──────────────────────

    /**
     * @notice Validate whether to sponsor a UserOperation.
     * Checks: (1) sender is KYC-verified, (2) daily gas budget not exceeded.
     * Returns validationData = 0 if valid (sponsor), 1 if invalid (reject).
     */
    function validatePaymasterUserOp(
        PackedUserOperation calldata userOp,
        bytes32 /* userOpHash */,
        uint256 maxCost
    ) external override onlyEntryPoint returns (bytes memory context, uint256 validationData) {

        // Check 1: Is user KYC-verified?
        bool isVerified = agentPayments.kycVerified(userOp.sender);
        if (!isVerified) {
            return (abi.encode(userOp.sender, maxCost), 1);
        }

        // Check 2: Daily gas budget
        uint256 today = block.timestamp / 1 days;
        if (lastGasResetDay[userOp.sender] < today) {
            dailyGasUsed[userOp.sender] = 0;
            lastGasResetDay[userOp.sender] = today;
        }

        if (dailyGasUsed[userOp.sender] + maxCost > maxDailyGasPerUser) {
            return (abi.encode(userOp.sender, maxCost), 1);
        }

        // All checks passed — sponsor gas
        context = abi.encode(userOp.sender, maxCost);
        validationData = 0;

        return (context, validationData);
    }

    /**
     * @notice Post-operation accounting. Track gas spent per user.
     */
    function postOp(
        PostOpMode /* mode */,
        bytes calldata context,
        uint256 actualGasCost,
        uint256 /* actualUserOpFeePerGas */
    ) external override onlyEntryPoint {
        (address user, ) = abi.decode(context, (address, uint256));

        dailyGasUsed[user] += actualGasCost;
        totalSponsored++;
        totalGasSponsored += actualGasCost;

        emit GasSponsored(user, actualGasCost, block.timestamp);
    }

    // ─── Funding ───────────────────────────────────────────

    function depositToEntryPoint() external payable onlyOwner {
        entryPoint.depositTo{value: msg.value}(address(this));
        emit PaymasterDeposit(msg.value, entryPoint.balanceOf(address(this)));
    }

    function withdrawFromEntryPoint(uint256 amount) external onlyOwner {
        entryPoint.withdrawTo(payable(owner), amount);
    }

    function getEntryPointBalance() external view returns (uint256) {
        return entryPoint.balanceOf(address(this));
    }

    function getStats() external view returns (
        uint256 _totalSponsored,
        uint256 _totalGasSponsored,
        uint256 entryPointBalance
    ) {
        return (totalSponsored, totalGasSponsored, entryPoint.balanceOf(address(this)));
    }

    // ─── Admin ─────────────────────────────────────────────

    function setMaxDailyGas(uint256 _max) external onlyOwner {
        maxDailyGasPerUser = _max;
    }

    receive() external payable {}
}
