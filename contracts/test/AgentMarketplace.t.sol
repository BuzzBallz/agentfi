// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentNFT} from "../src/AgentNFT.sol";
import {AgentMarketplace} from "../src/AgentMarketplace.sol";

contract AgentMarketplaceTest is Test {
    AgentNFT public nft;
    AgentMarketplace public marketplace;

    address owner = address(this);
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address user3 = makeAddr("user3");

    function setUp() public {
        nft = new AgentNFT(owner);
        marketplace = new AgentMarketplace(address(nft));

        // Mint token 0 to user1
        AgentNFT.AgentMetadata memory meta = AgentNFT.AgentMetadata({
            modelHash: "QmHash123",
            systemPrompt: "You are a DeFi agent",
            capabilities: "swap,lend",
            pricePerCall: 0.001 ether
        });
        nft.mint(user1, "ipfs://token0", meta);
    }

    function test_ListAgent() public {
        vm.expectEmit(true, true, false, true);
        emit AgentMarketplace.AgentListed(0, user1, 0.01 ether);

        vm.prank(user1);
        marketplace.listAgent(0, 0.01 ether);

        AgentMarketplace.AgentListing memory listing = marketplace.getListing(0);
        assertEq(listing.tokenId, 0);
        assertEq(listing.owner, user1);
        assertEq(listing.pricePerHire, 0.01 ether);
        assertTrue(listing.active);
    }

    function test_HireAgent() public {
        vm.prank(user1);
        marketplace.listAgent(0, 0.01 ether);

        uint256 user1BalanceBefore = user1.balance;

        vm.deal(user2, 1 ether);

        vm.expectEmit(true, true, false, true);
        emit AgentMarketplace.AgentHired(0, user2, 0.01 ether);

        vm.prank(user2);
        marketplace.hireAgent{value: 0.01 ether}(0);

        assertEq(user1.balance, user1BalanceBefore + 0.01 ether);
        // NFT ownership does NOT transfer
        assertEq(nft.ownerOf(0), user1);
    }

    function test_DelistAgent() public {
        vm.startPrank(user1);
        marketplace.listAgent(0, 0.01 ether);

        vm.expectEmit(true, false, false, true);
        emit AgentMarketplace.AgentDelisted(0);

        marketplace.delistAgent(0);
        vm.stopPrank();

        AgentMarketplace.AgentListing memory listing = marketplace.getListing(0);
        assertFalse(listing.active);
    }

    function test_GetListedAgents() public {
        // Mint a second token to user1
        AgentNFT.AgentMetadata memory meta = AgentNFT.AgentMetadata({
            modelHash: "QmHash456",
            systemPrompt: "Agent 2",
            capabilities: "bridge",
            pricePerCall: 0.002 ether
        });
        nft.mint(user1, "ipfs://token1", meta);

        // List both tokens
        vm.startPrank(user1);
        marketplace.listAgent(0, 0.01 ether);
        marketplace.listAgent(1, 0.02 ether);

        // Delist token 0
        marketplace.delistAgent(0);
        vm.stopPrank();

        AgentMarketplace.AgentListing[] memory active = marketplace.getListedAgents();
        assertEq(active.length, 1);
        assertEq(active[0].tokenId, 1);
    }

    function test_HireAgentOverpayment() public {
        vm.prank(user1);
        marketplace.listAgent(0, 0.01 ether);

        uint256 user1BalanceBefore = user1.balance;

        vm.deal(user2, 1 ether);
        vm.prank(user2);
        marketplace.hireAgent{value: 0.05 ether}(0);

        // Entire msg.value is forwarded, not just pricePerHire
        assertEq(user1.balance, user1BalanceBefore + 0.05 ether);
    }

    function test_RevertWhen_NonOwnerLists() public {
        vm.prank(user2);
        vm.expectRevert(AgentMarketplace.NotTokenOwner.selector);
        marketplace.listAgent(0, 0.01 ether);
    }

    function test_RevertWhen_NonOwnerDelists() public {
        vm.prank(user1);
        marketplace.listAgent(0, 0.01 ether);

        vm.prank(user2);
        vm.expectRevert(AgentMarketplace.NotTokenOwner.selector);
        marketplace.delistAgent(0);
    }

    function test_RevertWhen_HireWithInsufficientPayment() public {
        vm.prank(user1);
        marketplace.listAgent(0, 0.01 ether);

        vm.deal(user2, 1 ether);
        vm.prank(user2);
        vm.expectRevert(AgentMarketplace.InsufficientPayment.selector);
        marketplace.hireAgent{value: 0.001 ether}(0);
    }

    function test_RevertWhen_HireDelistedAgent() public {
        vm.startPrank(user1);
        marketplace.listAgent(0, 0.01 ether);
        marketplace.delistAgent(0);
        vm.stopPrank();

        vm.deal(user2, 1 ether);
        vm.prank(user2);
        vm.expectRevert(AgentMarketplace.AgentNotListed.selector);
        marketplace.hireAgent{value: 0.01 ether}(0);
    }

    function test_RevertWhen_ListAlreadyListedAgent() public {
        vm.startPrank(user1);
        marketplace.listAgent(0, 0.01 ether);

        vm.expectRevert(AgentMarketplace.AgentAlreadyListed.selector);
        marketplace.listAgent(0, 0.02 ether);
        vm.stopPrank();
    }
}
