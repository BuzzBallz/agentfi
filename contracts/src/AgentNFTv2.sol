// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC7857} from "./interfaces/IERC7857.sol";

/// @title AgentNFTv2
/// @notice ERC-7857 iNFT implementation for autonomous AI agents on 0G Chain.
///         Extends ERC-721 with encrypted metadata, usage authorization, and agent cloning.
contract AgentNFTv2 is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard, IERC7857 {
    // ---------------------------------------------------------------
    //  Custom Errors
    // ---------------------------------------------------------------

    error Unauthorized();
    error TokenDoesNotExist(uint256 tokenId);
    error NotTokenOwner();
    error NotOwnerOrApproved();

    // ---------------------------------------------------------------
    //  Types
    // ---------------------------------------------------------------

    struct AgentMetadata {
        string name;
        string description;
        string capabilities;
        uint256 pricePerCall;
    }

    // ---------------------------------------------------------------
    //  ERC-7857 Core Storage
    // ---------------------------------------------------------------

    /// @dev SHA256 of encrypted agent intelligence
    mapping(uint256 => bytes32) private _metadataHashes;

    /// @dev Pointer to encrypted metadata on 0G Storage
    mapping(uint256 => string) private _encryptedURIs;

    /// @dev Encrypted decryption key per token (re-encrypted on transfer)
    mapping(uint256 => bytes) private _sealedKeys;

    /// @dev Generation counter per token — incremented on transfer to invalidate all authorizations
    mapping(uint256 => uint256) private _authGeneration;

    /// @dev Tracks at which generation an authorization was granted
    mapping(uint256 => mapping(address => uint256)) private _authGrantedAt;

    // ---------------------------------------------------------------
    //  Agent Storage
    // ---------------------------------------------------------------

    mapping(uint256 => AgentMetadata) public agentData;
    uint256 private _nextTokenId;

    /// @dev Address of the marketplace contract (allowed to call authorizeUsage)
    address public marketplace;

    // ---------------------------------------------------------------
    //  Events (non-ERC-7857)
    // ---------------------------------------------------------------

    event AgentMinted(uint256 indexed tokenId, address indexed owner);
    event MarketplaceUpdated(address oldMarketplace, address newMarketplace);

    // ---------------------------------------------------------------
    //  Constructor
    // ---------------------------------------------------------------

    constructor(address initialOwner)
        ERC721("AgentFi iNFT", "AGENT")
        Ownable(initialOwner)
    {}

    // ---------------------------------------------------------------
    //  Minting
    // ---------------------------------------------------------------

    /// @notice Mint a new iNFT agent (owner only, can mint to any address)
    function mint(
        address to,
        string calldata uri,
        AgentMetadata calldata metadata,
        bytes32 metadataHash,
        string calldata encryptedURI,
        bytes calldata sealedKey
    ) external onlyOwner returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        agentData[tokenId] = metadata;
        _metadataHashes[tokenId] = metadataHash;
        _encryptedURIs[tokenId] = encryptedURI;
        _sealedKeys[tokenId] = sealedKey;

        // Generation starts at 1 so that default 0 in _authGrantedAt means "not authorized"
        _authGeneration[tokenId] = 1;

        emit AgentMinted(tokenId, to);
    }

    /// @notice Public mint — anyone can create an agent iNFT (minted to msg.sender)
    function publicMint(
        string calldata uri,
        AgentMetadata calldata metadata,
        bytes32 metadataHash,
        string calldata encryptedURI,
        bytes calldata sealedKey
    ) external returns (uint256 tokenId) {
        tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, uri);

        agentData[tokenId] = metadata;
        _metadataHashes[tokenId] = metadataHash;
        _encryptedURIs[tokenId] = encryptedURI;
        _sealedKeys[tokenId] = sealedKey;

        _authGeneration[tokenId] = 1;

        emit AgentMinted(tokenId, msg.sender);
    }

    // ---------------------------------------------------------------
    //  ERC-7857: Transfer with re-encryption
    // ---------------------------------------------------------------

    /// @inheritdoc IERC7857
    function transfer(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata /*proof*/
    ) external override(IERC7857) nonReentrant {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != from) revert NotTokenOwner();
        // Caller must be the owner or approved
        if (msg.sender != from && !isApprovedForAll(from, msg.sender) && getApproved(tokenId) != msg.sender) {
            revert NotOwnerOrApproved();
        }

        // Transfer the NFT
        _transfer(from, to, tokenId);

        // Update sealed key for new owner
        _sealedKeys[tokenId] = sealedKey;

        // Invalidate all existing authorizations by incrementing generation
        _authGeneration[tokenId]++;

        emit AgentTransferred(tokenId, from, to);
    }

    // ---------------------------------------------------------------
    //  ERC-7857: Clone
    // ---------------------------------------------------------------

    /// @inheritdoc IERC7857
    function clone(
        address to,
        uint256 tokenId,
        bytes calldata sealedKey,
        bytes calldata /*proof*/
    ) external override(IERC7857) nonReentrant returns (uint256 newTokenId) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        newTokenId = _nextTokenId++;
        _safeMint(to, newTokenId);

        // Copy metadata
        _setTokenURI(newTokenId, tokenURI(tokenId));
        agentData[newTokenId] = agentData[tokenId];
        _metadataHashes[newTokenId] = _metadataHashes[tokenId];
        _encryptedURIs[newTokenId] = _encryptedURIs[tokenId];

        // Set clone's own sealed key
        _sealedKeys[newTokenId] = sealedKey;

        // Initialize generation for clone
        _authGeneration[newTokenId] = 1;

        emit AgentCloned(tokenId, newTokenId, to);
    }

    // ---------------------------------------------------------------
    //  ERC-7857: Authorization
    // ---------------------------------------------------------------

    /// @inheritdoc IERC7857
    function authorizeUsage(
        uint256 tokenId,
        address executor,
        bytes calldata /*permissions*/
    ) external override(IERC7857) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        // Only owner or marketplace can authorize
        if (msg.sender != ownerOf(tokenId) && msg.sender != marketplace) {
            revert Unauthorized();
        }

        _authGrantedAt[tokenId][executor] = _authGeneration[tokenId];

        emit UsageAuthorized(tokenId, executor);
    }

    /// @inheritdoc IERC7857
    function revokeUsage(uint256 tokenId, address executor) external override(IERC7857) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        _authGrantedAt[tokenId][executor] = 0;

        emit UsageRevoked(tokenId, executor);
    }

    /// @inheritdoc IERC7857
    function isAuthorized(uint256 tokenId, address executor) external view override(IERC7857) returns (bool) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        // Owner is ALWAYS authorized (implicit)
        if (executor == ownerOf(tokenId)) return true;
        // Check generation-based authorization
        return _authGrantedAt[tokenId][executor] == _authGeneration[tokenId]
            && _authGeneration[tokenId] != 0;
    }

    // ---------------------------------------------------------------
    //  Metadata Management
    // ---------------------------------------------------------------

    function updateMetadataHash(uint256 tokenId, bytes32 newHash) external {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        _metadataHashes[tokenId] = newHash;

        emit MetadataUpdated(tokenId, newHash);
    }

    function updateEncryptedURI(uint256 tokenId, string calldata newURI) external {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        _encryptedURIs[tokenId] = newURI;
    }

    function updateAgentData(uint256 tokenId, AgentMetadata calldata metadata) external {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        if (ownerOf(tokenId) != msg.sender) revert NotTokenOwner();

        agentData[tokenId] = metadata;
    }

    // ---------------------------------------------------------------
    //  View Functions
    // ---------------------------------------------------------------

    /// @inheritdoc IERC7857
    function getMetadataHash(uint256 tokenId) external view override(IERC7857) returns (bytes32) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return _metadataHashes[tokenId];
    }

    /// @inheritdoc IERC7857
    function getEncryptedURI(uint256 tokenId) external view override(IERC7857) returns (string memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return _encryptedURIs[tokenId];
    }

    function getAgentData(uint256 tokenId) external view returns (AgentMetadata memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return agentData[tokenId];
    }

    function getSealedKey(uint256 tokenId) external view returns (bytes memory) {
        if (_ownerOf(tokenId) == address(0)) revert TokenDoesNotExist(tokenId);
        return _sealedKeys[tokenId];
    }

    // ---------------------------------------------------------------
    //  Admin
    // ---------------------------------------------------------------

    function setMarketplace(address _marketplace) external onlyOwner {
        address old = marketplace;
        marketplace = _marketplace;
        emit MarketplaceUpdated(old, _marketplace);
    }

    // ---------------------------------------------------------------
    //  Required Overrides
    // ---------------------------------------------------------------

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return interfaceId == type(IERC7857).interfaceId || super.supportsInterface(interfaceId);
    }
}
