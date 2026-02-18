// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AgentNFT
/// @notice ERC-7857 iNFT implementation for autonomous AI agents on 0G Chain.
///         Extends ERC-721 with on-chain agent metadata (model hash, prompt, capabilities, price).
contract AgentNFT is ERC721, ERC721URIStorage, Ownable {
    // ---------------------------------------------------------------
    //  Custom Errors
    // ---------------------------------------------------------------

    /// @notice Thrown when the caller is not authorised for the action.
    error Unauthorized();

    /// @notice Thrown when the referenced token does not exist.
    /// @param tokenId The non-existent token ID.
    error TokenDoesNotExist(uint256 tokenId);

    // ---------------------------------------------------------------
    //  Events
    // ---------------------------------------------------------------

    /// @notice Emitted when a new agent iNFT is minted.
    /// @param tokenId The newly minted token ID.
    /// @param owner   The address that received the token.
    event AgentMinted(uint256 indexed tokenId, address indexed owner);

    /// @notice Emitted when an agent's metadata is updated.
    /// @param tokenId The token whose metadata changed.
    event AgentMetadataUpdated(uint256 indexed tokenId);

    // ---------------------------------------------------------------
    //  Types
    // ---------------------------------------------------------------

    /// @notice On-chain metadata that describes an AI agent.
    struct AgentMetadata {
        string modelHash;
        string systemPrompt;
        string capabilities;
        uint256 pricePerCall;
    }

    // ---------------------------------------------------------------
    //  State
    // ---------------------------------------------------------------

    /// @notice Mapping from token ID to its agent metadata.
    mapping(uint256 => AgentMetadata) public agentData;

    /// @dev Auto-incrementing counter for the next token ID.
    uint256 private _nextTokenId;

    // ---------------------------------------------------------------
    //  Constructor
    // ---------------------------------------------------------------

    /// @notice Deploys the AgentNFT collection.
    /// @param initialOwner The address that will own the contract (can mint).
    constructor(address initialOwner)
        ERC721("AgentFi iNFT", "AGENT")
        Ownable(initialOwner)
    {}

    // ---------------------------------------------------------------
    //  External / Public Functions
    // ---------------------------------------------------------------

    /// @notice Mints a new agent iNFT with the given metadata.
    /// @param to       The recipient of the newly minted token.
    /// @param uri      The token URI (off-chain metadata pointer).
    /// @param metadata The on-chain agent metadata.
    /// @return tokenId The ID of the newly minted token.
    function mint(
        address to,
        string calldata uri,
        AgentMetadata calldata metadata
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        agentData[tokenId] = metadata;

        emit AgentMinted(tokenId, to);
    }

    /// @notice Updates the on-chain metadata for an existing agent.
    /// @param tokenId  The token to update.
    /// @param metadata The new metadata values.
    function updateMetadata(uint256 tokenId, AgentMetadata calldata metadata) external {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert Unauthorized();

        agentData[tokenId] = metadata;

        emit AgentMetadataUpdated(tokenId);
    }

    /// @notice Returns the on-chain metadata for a given agent.
    /// @param tokenId The token to query.
    /// @return The agent's metadata struct.
    function getAgentData(uint256 tokenId) external view returns (AgentMetadata memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return agentData[tokenId];
    }

    // ---------------------------------------------------------------
    //  Required Overrides (ERC721 + ERC721URIStorage)
    // ---------------------------------------------------------------

    /// @notice Returns the token URI, using the URI-storage extension.
    /// @param tokenId The token to query.
    /// @return The token's URI string.
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @notice ERC-165 introspection.
    /// @param interfaceId The interface identifier to check.
    /// @return True if the interface is supported.
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
