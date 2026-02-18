// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AgentNFT} from "./AgentNFT.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentMarketplace
/// @notice Marketplace for listing and hiring AI agents (iNFTs) on 0G Chain.
///         Hiring pays the agent owner but does NOT transfer NFT ownership.
contract AgentMarketplace is ReentrancyGuard, Ownable {
    // ---------------------------------------------------------------
    //  Custom Errors
    // ---------------------------------------------------------------

    /// @notice Thrown when the caller does not own the NFT.
    error NotTokenOwner();

    /// @notice Thrown when the referenced agent is not actively listed.
    error AgentNotListed();

    /// @notice Thrown when the agent is already listed on the marketplace.
    error AgentAlreadyListed();

    /// @notice Thrown when msg.value is less than the listing price.
    error InsufficientPayment();

    /// @notice Thrown when an ETH transfer to the listing owner fails.
    error TransferFailed();

    // ---------------------------------------------------------------
    //  Events
    // ---------------------------------------------------------------

    /// @notice Emitted when an agent is listed on the marketplace.
    /// @param tokenId      The listed token ID.
    /// @param owner        The address that owns the agent NFT.
    /// @param pricePerHire The price (in wei) to hire this agent.
    event AgentListed(uint256 indexed tokenId, address indexed owner, uint256 pricePerHire);

    /// @notice Emitted when an agent is hired.
    /// @param tokenId The hired token ID.
    /// @param hirer   The address that hired the agent.
    /// @param price   The amount paid (in wei).
    event AgentHired(uint256 indexed tokenId, address indexed hirer, uint256 price);

    /// @notice Emitted when an agent is delisted from the marketplace.
    /// @param tokenId The delisted token ID.
    event AgentDelisted(uint256 indexed tokenId);

    // ---------------------------------------------------------------
    //  Types
    // ---------------------------------------------------------------

    /// @notice Represents an agent listing on the marketplace.
    struct AgentListing {
        uint256 tokenId;
        address owner;
        uint256 pricePerHire;
        bool active;
    }

    // ---------------------------------------------------------------
    //  State
    // ---------------------------------------------------------------

    /// @notice Reference to the AgentNFT contract for ownership checks.
    AgentNFT public immutable agentNFT;

    /// @notice Mapping from token ID to its marketplace listing.
    mapping(uint256 => AgentListing) public listings;

    /// @notice Array of all token IDs that have been listed (for enumeration).
    uint256[] public listedTokenIds;

    // ---------------------------------------------------------------
    //  Constructor
    // ---------------------------------------------------------------

    /// @notice Deploys the marketplace linked to an AgentNFT contract.
    /// @param agentNFTAddress The address of the deployed AgentNFT contract.
    constructor(address agentNFTAddress) Ownable(msg.sender) {
        agentNFT = AgentNFT(agentNFTAddress);
    }

    // ---------------------------------------------------------------
    //  External Functions
    // ---------------------------------------------------------------

    /// @notice Lists an agent for hire on the marketplace.
    /// @param tokenId      The token ID of the agent to list.
    /// @param pricePerHire The price (in wei) to hire this agent.
    function listAgent(uint256 tokenId, uint256 pricePerHire) external {
        if (agentNFT.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        if (listings[tokenId].active) revert AgentAlreadyListed();

        listings[tokenId] = AgentListing({
            tokenId: tokenId,
            owner: msg.sender,
            pricePerHire: pricePerHire,
            active: true
        });
        listedTokenIds.push(tokenId);

        emit AgentListed(tokenId, msg.sender, pricePerHire);
    }

    /// @notice Removes an agent from the marketplace.
    /// @param tokenId The token ID to delist.
    function delistAgent(uint256 tokenId) external {
        AgentListing storage listing = listings[tokenId];
        if (!listing.active) revert AgentNotListed();
        if (listing.owner != msg.sender) revert NotTokenOwner();

        listing.active = false;

        emit AgentDelisted(tokenId);
    }

    /// @notice Hires an agent by paying the listing price.
    /// @dev    Payment is forwarded to the listing owner. The NFT is NOT transferred.
    /// @param tokenId The token ID of the agent to hire.
    function hireAgent(uint256 tokenId) external payable nonReentrant {
        AgentListing storage listing = listings[tokenId];
        if (!listing.active) revert AgentNotListed();
        if (msg.value < listing.pricePerHire) revert InsufficientPayment();

        (bool success,) = payable(listing.owner).call{value: msg.value}("");
        if (!success) revert TransferFailed();

        emit AgentHired(tokenId, msg.sender, msg.value);
    }

    /// @notice Returns all currently active listings.
    /// @return activeListings An array of active AgentListing structs.
    function getListedAgents() external view returns (AgentListing[] memory) {
        uint256 activeCount;
        for (uint256 i; i < listedTokenIds.length; ++i) {
            if (listings[listedTokenIds[i]].active) ++activeCount;
        }

        AgentListing[] memory activeListings = new AgentListing[](activeCount);
        uint256 idx;
        for (uint256 i; i < listedTokenIds.length; ++i) {
            if (listings[listedTokenIds[i]].active) {
                activeListings[idx++] = listings[listedTokenIds[i]];
            }
        }
        return activeListings;
    }

    /// @notice Returns the listing details for a specific agent.
    /// @param tokenId The token ID to query.
    /// @return The AgentListing struct for the given token.
    function getListing(uint256 tokenId) external view returns (AgentListing memory) {
        return listings[tokenId];
    }
}
