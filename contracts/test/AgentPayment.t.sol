// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentPayment} from "../src/AgentPayment.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract AgentPaymentTest is Test {
    AgentPayment public payment;

    address owner = address(this);
    address user1 = makeAddr("user1");
    address user2 = makeAddr("user2");
    address user3 = makeAddr("user3");

    function setUp() public {
        payment = new AgentPayment();
        payment.addToWhitelist(user1);
        payment.addToWhitelist(user2);
    }

    function test_Pay() public {
        vm.deal(user1, 1 ether);

        uint256 user2BalanceBefore = user2.balance;

        vm.expectEmit(true, true, false, true);
        emit AgentPayment.PaymentSent(user1, user2, 0.1 ether, 1);

        vm.prank(user1);
        payment.pay{value: 0.1 ether}(user2, 1);

        assertEq(user2.balance, user2BalanceBefore + 0.1 ether);
        assertEq(payment.totalPaymentsProcessed(), 1);
    }

    function test_AddToWhitelist() public {
        vm.expectEmit(true, false, false, true);
        emit AgentPayment.UserVerified(user3);

        payment.addToWhitelist(user3);

        assertTrue(payment.isVerified(user3));
    }

    function test_RemoveFromWhitelist() public {
        vm.expectEmit(true, false, false, true);
        emit AgentPayment.UserRemoved(user1);

        payment.removeFromWhitelist(user1);

        assertFalse(payment.isVerified(user1));
    }

    function test_BatchWhitelist() public {
        address user4 = makeAddr("user4");
        address user5 = makeAddr("user5");

        address[] memory users = new address[](3);
        users[0] = user3;
        users[1] = user4;
        users[2] = user5;

        payment.batchWhitelist(users);

        assertTrue(payment.isVerified(user3));
        assertTrue(payment.isVerified(user4));
        assertTrue(payment.isVerified(user5));
    }

    function test_MultiplePayments() public {
        vm.deal(user1, 1 ether);

        vm.startPrank(user1);
        payment.pay{value: 0.1 ether}(user2, 1);
        payment.pay{value: 0.1 ether}(user2, 2);
        vm.stopPrank();

        assertEq(payment.totalPaymentsProcessed(), 2);
    }

    function test_RevertWhen_UnverifiedSenderPays() public {
        vm.deal(user3, 1 ether);

        vm.prank(user3);
        vm.expectRevert(AgentPayment.SenderNotVerified.selector);
        payment.pay{value: 0.1 ether}(user2, 1);
    }

    function test_RevertWhen_PayToUnverifiedRecipient() public {
        vm.deal(user1, 1 ether);

        vm.prank(user1);
        vm.expectRevert(AgentPayment.RecipientNotVerified.selector);
        payment.pay{value: 0.1 ether}(user3, 1);
    }

    function test_RevertWhen_ZeroPayment() public {
        vm.prank(user1);
        vm.expectRevert(AgentPayment.ZeroPayment.selector);
        payment.pay{value: 0}(user2, 1);
    }

    function test_RevertWhen_NonOwnerWhitelists() public {
        vm.prank(user1);
        vm.expectRevert(
            abi.encodeWithSelector(Ownable.OwnableUnauthorizedAccount.selector, user1)
        );
        payment.addToWhitelist(user3);
    }
}
