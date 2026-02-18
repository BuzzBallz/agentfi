// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title AgentPayment
/// @notice Compliance-native payment settlement for AI agent hires on ADI Chain.
///         Enforces a mock KYC whitelist (mirrors ADI's FATF Travel Rule) so that
///         only verified users can send or receive payments.
contract AgentPayment is Ownable, ReentrancyGuard {
    // ---------------------------------------------------------------
    //  Custom Errors
    // ---------------------------------------------------------------

    /// @notice Thrown when the sender is not on the whitelist.
    error SenderNotVerified();

    /// @notice Thrown when the recipient is not on the whitelist.
    error RecipientNotVerified();

    /// @notice Thrown when msg.value is zero.
    error ZeroPayment();

    /// @notice Thrown when the ETH transfer to the recipient fails.
    error TransferFailed();

    // ---------------------------------------------------------------
    //  Events
    // ---------------------------------------------------------------

    /// @notice Emitted when a payment is successfully sent.
    /// @param sender       The address that sent the payment.
    /// @param recipient    The address that received the payment.
    /// @param amount       The amount of ETH transferred (in wei).
    /// @param agentTokenId The agent token ID this payment is associated with.
    event PaymentSent(
        address indexed sender,
        address indexed recipient,
        uint256 amount,
        uint256 agentTokenId
    );

    /// @notice Emitted when a user is added to the compliance whitelist.
    /// @param user The newly verified address.
    event UserVerified(address indexed user);

    /// @notice Emitted when a user is removed from the compliance whitelist.
    /// @param user The removed address.
    event UserRemoved(address indexed user);

    // ---------------------------------------------------------------
    //  State
    // ---------------------------------------------------------------

    /// @notice Admin-controlled compliance whitelist (mock KYC).
    mapping(address => bool) public verifiedUsers;

    /// @notice Running total of payments processed through this contract.
    uint256 public totalPaymentsProcessed;

    // ---------------------------------------------------------------
    //  Constructor
    // ---------------------------------------------------------------

    /// @notice Deploys the payment contract with the caller as owner.
    constructor() Ownable(msg.sender) {}

    // ---------------------------------------------------------------
    //  Admin Functions
    // ---------------------------------------------------------------

    /// @notice Adds a user to the compliance whitelist.
    /// @param user The address to verify.
    function addToWhitelist(address user) external onlyOwner {
        verifiedUsers[user] = true;
        emit UserVerified(user);
    }

    /// @notice Removes a user from the compliance whitelist.
    /// @param user The address to remove.
    function removeFromWhitelist(address user) external onlyOwner {
        verifiedUsers[user] = false;
        emit UserRemoved(user);
    }

    /// @notice Adds multiple users to the whitelist in a single transaction.
    /// @param users The addresses to verify.
    function batchWhitelist(address[] calldata users) external onlyOwner {
        for (uint256 i; i < users.length; ++i) {
            verifiedUsers[users[i]] = true;
            emit UserVerified(users[i]);
        }
    }

    // ---------------------------------------------------------------
    //  View Functions
    // ---------------------------------------------------------------

    /// @notice Checks whether an address is on the compliance whitelist.
    /// @param user The address to check.
    /// @return True if the address is verified.
    function isVerified(address user) external view returns (bool) {
        return verifiedUsers[user];
    }

    // ---------------------------------------------------------------
    //  Payment Function
    // ---------------------------------------------------------------

    /// @notice Sends a payment to a recipient for an agent hire.
    /// @dev    Both sender and recipient must be whitelisted. ETH is forwarded directly.
    /// @param recipient    The address to receive the payment.
    /// @param agentTokenId The agent token ID this payment is associated with.
    function pay(address recipient, uint256 agentTokenId) external payable nonReentrant {
        if (!verifiedUsers[msg.sender]) revert SenderNotVerified();
        if (!verifiedUsers[recipient]) revert RecipientNotVerified();
        if (msg.value == 0) revert ZeroPayment();

        ++totalPaymentsProcessed;

        (bool success,) = payable(recipient).call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit PaymentSent(msg.sender, recipient, msg.value, agentTokenId);
    }
}
