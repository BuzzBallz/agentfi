// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {AgentRegistry, IAgentNFT} from "../src/AgentRegistry.sol";
import {AgentNFTv2} from "../src/AgentNFTv2.sol";

contract AgentRegistryTest is Test {
    AgentRegistry public registry;
    AgentNFTv2 public nft;

    address deployer = address(this); // owns the NFT contract (Ownable)
    address alice = makeAddr("alice"); // owns token 0
    address bob = makeAddr("bob"); // owns token 1

    function setUp() public {
        nft = new AgentNFTv2(deployer);
        registry = new AgentRegistry(address(nft));

        // Mint token 0 → alice, token 1 → bob
        nft.mint(
            alice,
            "ipfs://0",
            AgentNFTv2.AgentMetadata({
                name: "Portfolio Analyzer",
                description: "Analyzes portfolios",
                capabilities: '["analysis"]',
                pricePerCall: 0.001 ether
            }),
            keccak256("hash0"),
            "0g://enc/0",
            bytes("key0")
        );

        nft.mint(
            bob,
            "ipfs://1",
            AgentNFTv2.AgentMetadata({
                name: "Yield Optimizer",
                description: "Optimizes yield",
                capabilities: '["yield"]',
                pricePerCall: 0.001 ether
            }),
            keccak256("hash1"),
            "0g://enc/1",
            bytes("key1")
        );
    }

    // ─── setHederaAccounts ──────────────────────────────────

    function test_setHederaAccounts_success() public {
        vm.expectEmit(true, false, false, true);
        emit AgentRegistry.HederaAccountSet(0, "0.0.7977799", "0.0.7973940");

        vm.prank(alice);
        registry.setHederaAccounts(0, "0.0.7977799", "0.0.7973940");

        assertEq(registry.agentHederaAccounts(0), "0.0.7977799");
        assertEq(registry.ownerHederaAccounts(0), "0.0.7973940");
    }

    function test_setHederaAccounts_revertsNonOwner() public {
        vm.prank(bob);
        vm.expectRevert("AgentRegistry: caller is not agent owner");
        registry.setHederaAccounts(0, "0.0.1", "0.0.2");
    }

    function test_setHederaAccounts_revertsEmptyAgent() public {
        vm.prank(alice);
        vm.expectRevert("AgentRegistry: empty agent account");
        registry.setHederaAccounts(0, "", "0.0.1");
    }

    function test_setHederaAccounts_revertsEmptyOwner() public {
        vm.prank(alice);
        vm.expectRevert("AgentRegistry: empty owner account");
        registry.setHederaAccounts(0, "0.0.1", "");
    }

    // ─── setX402Config ──────────────────────────────────────

    function test_setX402Config_success() public {
        AgentRegistry.X402Config memory config = AgentRegistry.X402Config({
            enabled: true,
            priceAFC: 100,
            priceUSDT: 10000,
            maxBudgetAFC: 500,
            allowCrossAgent: true
        });

        vm.expectEmit(true, false, false, true);
        emit AgentRegistry.X402ConfigUpdated(0, true, 100, 10000, 500, true);

        vm.prank(alice);
        registry.setX402Config(0, config);

        (bool enabled, uint256 priceAFC, uint256 priceUSDT, uint256 maxBudget, bool allowCross) =
            registry.x402Configs(0);
        assertTrue(enabled);
        assertEq(priceAFC, 100);
        assertEq(priceUSDT, 10000);
        assertEq(maxBudget, 500);
        assertTrue(allowCross);
    }

    function test_setX402Config_revertsNonOwner() public {
        AgentRegistry.X402Config memory config = AgentRegistry.X402Config({
            enabled: true,
            priceAFC: 100,
            priceUSDT: 10000,
            maxBudgetAFC: 500,
            allowCrossAgent: true
        });

        vm.prank(bob);
        vm.expectRevert("AgentRegistry: caller is not agent owner");
        registry.setX402Config(0, config);
    }

    // ─── Token 0 owner cannot configure token 1 ────────────

    function test_ownerOfToken0_cannotConfigureToken1() public {
        // alice owns token 0 but NOT token 1 (owned by bob)
        vm.prank(alice);
        vm.expectRevert("AgentRegistry: caller is not agent owner");
        registry.setHederaAccounts(1, "0.0.1", "0.0.2");

        AgentRegistry.X402Config memory config = AgentRegistry.X402Config({
            enabled: true,
            priceAFC: 50,
            priceUSDT: 5000,
            maxBudgetAFC: 200,
            allowCrossAgent: false
        });

        vm.prank(alice);
        vm.expectRevert("AgentRegistry: caller is not agent owner");
        registry.setX402Config(1, config);
    }

    // ─── setX402Enabled ─────────────────────────────────────

    function test_setX402Enabled_toggle() public {
        assertFalse(registry.isX402Enabled(0));

        vm.prank(alice);
        registry.setX402Enabled(0, true);
        assertTrue(registry.isX402Enabled(0));

        vm.prank(alice);
        registry.setX402Enabled(0, false);
        assertFalse(registry.isX402Enabled(0));
    }

    // ─── setX402PriceAFC ────────────────────────────────────

    function test_setX402PriceAFC() public {
        vm.prank(alice);
        registry.setX402PriceAFC(0, 200);
        (, uint256 priceAFC,,,) = registry.x402Configs(0);
        assertEq(priceAFC, 200);
    }

    // ─── getAgentFullConfig ─────────────────────────────────

    function test_getAgentFullConfig() public {
        vm.startPrank(alice);
        registry.setHederaAccounts(0, "0.0.7977799", "0.0.7973940");
        registry.setX402Config(
            0,
            AgentRegistry.X402Config({
                enabled: true,
                priceAFC: 100,
                priceUSDT: 10000,
                maxBudgetAFC: 500,
                allowCrossAgent: true
            })
        );
        vm.stopPrank();

        (string memory agentHedera, string memory ownerHedera, AgentRegistry.X402Config memory cfg)
        = registry.getAgentFullConfig(0);

        assertEq(agentHedera, "0.0.7977799");
        assertEq(ownerHedera, "0.0.7973940");
        assertTrue(cfg.enabled);
        assertEq(cfg.priceAFC, 100);
        assertEq(cfg.priceUSDT, 10000);
        assertEq(cfg.maxBudgetAFC, 500);
        assertTrue(cfg.allowCrossAgent);
    }

    // ─── isX402Enabled ──────────────────────────────────────

    function test_isX402Enabled_defaultFalse() public view {
        assertFalse(registry.isX402Enabled(0));
    }

    // ─── calculateAFCReward ─────────────────────────────────

    function test_calculateAFCReward_proportional() public view {
        uint256 reward = registry.calculateAFCReward(1000);
        assertEq(reward, 100);
    }

    function test_calculateAFCReward_minimumEnforced() public view {
        uint256 reward = registry.calculateAFCReward(1);
        assertEq(reward, 1);
    }

    function test_calculateAFCReward_zero() public view {
        uint256 reward = registry.calculateAFCReward(0);
        assertEq(reward, 1);
    }

    // ─── setAFCRewardRate ───────────────────────────────────

    function test_setAFCRewardRate_success() public {
        vm.expectEmit(false, false, false, true);
        emit AgentRegistry.AFCRewardRateUpdated(200, 500, 5);

        // deployer is the registry owner (Ownable)
        registry.setAFCRewardRate(200, 500, 5);

        assertEq(registry.afcRewardRate(), 200);
        assertEq(registry.afcRewardDivisor(), 500);
        assertEq(registry.afcMinReward(), 5);

        uint256 reward = registry.calculateAFCReward(1000);
        assertEq(reward, 400);
    }

    function test_setAFCRewardRate_revertsZeroDivisor() public {
        vm.expectRevert("AgentRegistry: divisor cannot be zero");
        registry.setAFCRewardRate(100, 0, 1);
    }

    function test_setAFCRewardRate_revertsNonOwner() public {
        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                bytes4(keccak256("OwnableUnauthorizedAccount(address)")), alice
            )
        );
        registry.setAFCRewardRate(100, 1000, 1);
    }
}
