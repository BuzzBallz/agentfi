// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentNFT} from "../src/AgentNFT.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentNFTTest is Test {
    AgentNFT public nft;

    address owner = address(this);
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address user3 = makeAddr("user3");

    function setUp() public {
        nft = new AgentNFT(owner);
    }

    function _defaultMetadata() internal pure returns (AgentNFT.AgentMetadata memory) {
        return AgentNFT.AgentMetadata({
            modelHash: "QmHash123",
            systemPrompt: "You are a helpful DeFi agent",
            capabilities: "swap,lend,bridge",
            pricePerCall: 0.001 ether
        });
    }

    function test_MintAgent() public {
        AgentNFT.AgentMetadata memory meta = _defaultMetadata();

        vm.expectEmit(true, true, false, true);
        emit AgentNFT.AgentMinted(0, user1);

        uint256 tokenId = nft.mint(user1, "ipfs://token0", meta);

        assertEq(tokenId, 0);
        assertEq(nft.ownerOf(0), user1);
        assertEq(nft.tokenURI(0), "ipfs://token0");

        AgentNFT.AgentMetadata memory stored = nft.getAgentData(0);
        assertEq(stored.modelHash, "QmHash123");
        assertEq(stored.systemPrompt, "You are a helpful DeFi agent");
        assertEq(stored.capabilities, "swap,lend,bridge");
        assertEq(stored.pricePerCall, 0.001 ether);
    }

    function test_MintMultipleAgents() public {
        AgentNFT.AgentMetadata memory meta = _defaultMetadata();

        uint256 id0 = nft.mint(user1, "ipfs://token0", meta);
        uint256 id1 = nft.mint(user2, "ipfs://token1", meta);
        uint256 id2 = nft.mint(user3, "ipfs://token2", meta);

        assertEq(id0, 0);
        assertEq(id1, 1);
        assertEq(id2, 2);
    }

    function test_UpdateMetadata() public {
        nft.mint(user1, "ipfs://token0", _defaultMetadata());

        AgentNFT.AgentMetadata memory newMeta = AgentNFT.AgentMetadata({
            modelHash: "QmNewHash",
            systemPrompt: "Updated prompt",
            capabilities: "swap,stake",
            pricePerCall: 0.005 ether
        });

        vm.prank(user1);
        nft.updateMetadata(0, newMeta);

        AgentNFT.AgentMetadata memory stored = nft.getAgentData(0);
        assertEq(stored.modelHash, "QmNewHash");
        assertEq(stored.systemPrompt, "Updated prompt");
        assertEq(stored.capabilities, "swap,stake");
        assertEq(stored.pricePerCall, 0.005 ether);
    }

    function test_GetAgentData() public {
        nft.mint(user1, "ipfs://token0", _defaultMetadata());

        AgentNFT.AgentMetadata memory data = nft.getAgentData(0);
        assertEq(data.modelHash, "QmHash123");
        assertEq(data.systemPrompt, "You are a helpful DeFi agent");
        assertEq(data.capabilities, "swap,lend,bridge");
        assertEq(data.pricePerCall, 0.001 ether);
    }

    function test_TransferAgent() public {
        nft.mint(user1, "ipfs://token0", _defaultMetadata());

        vm.prank(user1);
        nft.transferFrom(user1, user2, 0);

        assertEq(nft.ownerOf(0), user2);
    }

    function test_RevertWhen_NonOwnerMints() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1)
        );
        nft.mint(user1, "ipfs://token0", _defaultMetadata());
    }

    function test_RevertWhen_NonTokenOwnerUpdatesMetadata() public {
        nft.mint(user1, "ipfs://token0", _defaultMetadata());

        vm.prank(user2);
        vm.expectRevert(AgentNFT.Unauthorized.selector);
        nft.updateMetadata(0, _defaultMetadata());
    }

    function test_RevertWhen_GetDataForNonexistentToken() public {
        vm.expectRevert(
            abi.encodeWithSelector(AgentNFT.TokenDoesNotExist.selector, 999)
        );
        nft.getAgentData(999);
    }
}
