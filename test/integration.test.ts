import type { Address } from "@morpho-org/blue-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import { analyzeVault } from "../src/analyze.js";
import { compareVaults } from "../src/compare.js";
import { ZeroTotalAssetsError } from "../src/errors.js";
import {
	createMockVault,
	randomAddress,
	resetAddressCounter,
} from "./fixtures.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

describe("analyzeVault — realistic scenarios", () => {
	beforeEach(() => resetAddressCounter());

	test("conservative vault — low LLTV, diversified, long timelock, capped markets", () => {
		const oracle1 = randomAddress();
		const oracle2 = randomAddress();
		const oracle3 = randomAddress();
		const oracle4 = randomAddress();
		const collateral1 = randomAddress();
		const collateral2 = randomAddress();
		const collateral3 = randomAddress();
		const collateral4 = randomAddress();

		const vault = createMockVault({
			timelock: 604800n, // 7 days
			guardian: randomAddress(),
			curator: randomAddress(),
			fee: 50000000000000000n, // 5%
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 200_000n, // 20% utilization
						lltv: 500000000000000000n, // 50%
						oracle: oracle1,
						collateralToken: collateral1,
					},
					cap: 600_000n,
				},
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 200_000n,
						lltv: 500000000000000000n,
						oracle: oracle2,
						collateralToken: collateral2,
					},
					cap: 600_000n,
				},
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 200_000n,
						lltv: 500000000000000000n,
						oracle: oracle3,
						collateralToken: collateral3,
					},
					cap: 600_000n,
				},
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 200_000n,
						lltv: 500000000000000000n,
						oracle: oracle4,
						collateralToken: collateral4,
					},
					cap: 600_000n,
				},
			],
		});

		const result = analyzeVault(vault);

		// Concentration: 4 equal markets → HHI ≈ 0.25
		expect(result.concentration.hhi).toBeCloseTo(0.25, 1);
		expect(result.concentration.activeMarketCount).toBe(4);
		expect(result.concentration.effectiveMarketCount).toBeCloseTo(4, 0);

		// Liquidity: 20% utilization → high liquidity
		expect(result.liquidityCoverage.ratio).toBeGreaterThan(0.5);

		// Utilization: all markets at 20%
		expect(result.utilizationExposure.weightedAvg).toBeCloseTo(0.2, 1);

		// LLTV: all 50%, so min = max = weightedAvg
		expect(result.lltv.min).toBe(500000000000000000n);
		expect(result.lltv.max).toBe(500000000000000000n);
		expect(result.lltv.distinctValues).toHaveLength(1);

		// Oracle: 4 distinct oracles, none dominant
		expect(result.oracle.distinctCount).toBe(4);
		expect(result.oracle.isSingleOracleDominant).toBe(false);

		// Collateral: 4 distinct collaterals
		expect(result.collateralDiversity.distinctCount).toBe(4);
		expect(result.collateralDiversity.hhi).toBeCloseTo(0.25, 1);

		// Governance: 7-day timelock, guardian and curator set
		expect(result.governance.timelockTier).toBe("long");
		expect(result.governance.hasGuardian).toBe(true);
		expect(result.governance.hasCurator).toBe(true);
		expect(result.governance.fee).toBe(50000000000000000n);

		// Cap headroom: capped markets should have measurable utilization
		expect(result.capHeadroom.tightest).not.toBeNull();
		expect(result.capHeadroom.weightedAvgUtilization).toBeGreaterThan(0);
	});

	test("risky vault — single market, high LLTV, no timelock, near cap", () => {
		const vault = createMockVault({
			timelock: 0n,
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 950_000n, // 95% utilization
						lltv: 945000000000000000n, // 94.5%
					},
					cap: 600_000n, // tight cap relative to vault's ~500k supply
				},
			],
		});

		const result = analyzeVault(vault);

		// Single market → maximum concentration
		expect(result.concentration.hhi).toBe(1);
		expect(result.concentration.activeMarketCount).toBe(1);

		// 95% utilization → very low liquidity
		expect(result.liquidityCoverage.ratio).toBeLessThan(0.15);

		// High utilization
		expect(result.utilizationExposure.weightedAvg).toBeCloseTo(0.95, 1);
		expect(result.utilizationExposure.max).toBeCloseTo(0.95, 1);

		// Single high LLTV
		expect(result.lltv.min).toBe(945000000000000000n);
		expect(result.lltv.min).toBe(result.lltv.max);

		// Single oracle → dominant
		expect(result.oracle.distinctCount).toBe(1);
		expect(result.oracle.isSingleOracleDominant).toBe(true);

		// Single collateral
		expect(result.collateralDiversity.distinctCount).toBe(1);
		expect(result.collateralDiversity.hhi).toBeCloseTo(1.0, 1);

		// No governance protections
		expect(result.governance.timelockTier).toBe("none");
		expect(result.governance.hasGuardian).toBe(false);
		expect(result.governance.hasCurator).toBe(false);
	});

	test("mixed vault — dominant allocation shifts weighted metrics", () => {
		const sharedOracle = randomAddress();
		const dominantOracle = randomAddress();

		const vault = createMockVault({
			allocations: [
				{
					// Dominant market: ~80% of vault assets
					market: {
						totalSupplyAssets: 8_000_000n,
						totalBorrowAssets: 7_200_000n, // 90% utilization
						lltv: 900000000000000000n, // 90%
						oracle: dominantOracle,
					},
					supplyShares: (8_000_000n * 1_000_000n) / 2n,
				},
				{
					// Small market A
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 200_000n, // 20% utilization
						lltv: 500000000000000000n, // 50%
						oracle: sharedOracle,
					},
					supplyShares: (1_000_000n * 1_000_000n) / 2n,
				},
				{
					// Small market B
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 500_000n, // 50% utilization
						lltv: 700000000000000000n, // 70%
						oracle: sharedOracle,
					},
					supplyShares: (1_000_000n * 1_000_000n) / 2n,
				},
			],
		});

		const result = analyzeVault(vault);

		// HHI well above equal-weight case of 0.33
		expect(result.concentration.hhi).toBeGreaterThan(0.5);
		// Top market should hold ~80%
		expect(result.concentration.marketProportions[0]?.proportion).toBeCloseTo(
			0.8,
			1,
		);

		// Weighted utilization pulled toward 90%
		expect(result.utilizationExposure.weightedAvg).toBeGreaterThan(0.7);

		// LLTV weighted toward 90%
		expect(result.lltv.weightedAvg).toBeGreaterThan(800000000000000000n);
		expect(result.lltv.distinctValues).toHaveLength(3);

		// Dominant oracle holds ~80%
		expect(result.oracle.isSingleOracleDominant).toBe(true);
		expect(result.oracle.exposure[0]?.proportion).toBeCloseTo(0.8, 1);
	});

	test("many-market vault — 10 equal markets", () => {
		const allocations = Array.from({ length: 10 }, () => ({
			market: {
				totalSupplyAssets: 1_000_000n,
				totalBorrowAssets: 500_000n,
				lltv: 800000000000000000n,
				oracle: randomAddress(),
				collateralToken: randomAddress(),
			},
		}));

		const vault = createMockVault({ allocations });

		const result = analyzeVault(vault);

		// HHI ≈ 0.1 for 10 equal markets
		expect(result.concentration.hhi).toBeCloseTo(0.1, 1);
		expect(result.concentration.effectiveMarketCount).toBeCloseTo(10, 0);
		expect(result.concentration.activeMarketCount).toBe(10);

		// 10 distinct oracles and collaterals
		expect(result.oracle.distinctCount).toBe(10);
		expect(result.oracle.isSingleOracleDominant).toBe(false);
		expect(result.collateralDiversity.distinctCount).toBe(10);

		// All proportions roughly equal
		for (const mp of result.concentration.marketProportions) {
			expect(mp.proportion).toBeCloseTo(0.1, 1);
		}
	});
});

describe("compareVaults — ranking correctness", () => {
	beforeEach(() => resetAddressCounter());

	test("three stratified vaults ranked correctly across all metrics", () => {
		const safeAddr = randomAddress();
		const medAddr = randomAddress();
		const riskyAddr = randomAddress();

		const safe = createMockVault({
			address: safeAddr,
			timelock: 604800n, // 7 days
			guardian: randomAddress(),
			allocations: Array.from({ length: 4 }, () => ({
				market: {
					totalSupplyAssets: 1_000_000n,
					totalBorrowAssets: 200_000n,
					lltv: 500000000000000000n,
					oracle: randomAddress(),
					collateralToken: randomAddress(),
				},
			})),
		});

		const medium = createMockVault({
			address: medAddr,
			timelock: 86400n, // 1 day
			allocations: Array.from({ length: 2 }, () => ({
				market: {
					totalSupplyAssets: 1_000_000n,
					totalBorrowAssets: 500_000n,
					lltv: 750000000000000000n,
					oracle: randomAddress(),
					collateralToken: randomAddress(),
				},
			})),
		});

		const risky = createMockVault({
			address: riskyAddr,
			timelock: 0n,
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 900_000n,
						lltv: 945000000000000000n,
					},
				},
			],
		});

		const result = compareVaults([safe, medium, risky]);

		expect(result.vaults).toHaveLength(3);

		// Helper to find rank for a given vault address
		const findRank = (
			rankings: ReadonlyArray<{ vault: Address; rank: number }>,
			addr: Address,
		) => rankings.find((r) => r.vault === addr)?.rank;

		// Concentration: safe (4 markets) < medium (2) < risky (1)
		expect(findRank(result.rankings.concentration, safeAddr)).toBe(1);
		expect(findRank(result.rankings.concentration, medAddr)).toBe(2);
		expect(findRank(result.rankings.concentration, riskyAddr)).toBe(3);

		// Liquidity: safe (20% util) > medium (50%) > risky (90%)
		expect(findRank(result.rankings.liquidityCoverage, safeAddr)).toBe(1);
		expect(findRank(result.rankings.liquidityCoverage, riskyAddr)).toBe(3);

		// LLTV: safe (50%) < medium (75%) < risky (94.5%)
		expect(findRank(result.rankings.lltv, safeAddr)).toBe(1);
		expect(findRank(result.rankings.lltv, riskyAddr)).toBe(3);

		// Oracle diversity: safe (4) > medium (2) > risky (1)
		expect(findRank(result.rankings.oracleDiversity, safeAddr)).toBe(1);
		expect(findRank(result.rankings.oracleDiversity, riskyAddr)).toBe(3);

		// Governance: safe (7d) > medium (1d) > risky (0)
		expect(findRank(result.rankings.governance, safeAddr)).toBe(1);
		expect(findRank(result.rankings.governance, medAddr)).toBe(2);
		expect(findRank(result.rankings.governance, riskyAddr)).toBe(3);
	});

	test("vaults can rank differently per metric — no single composite score", () => {
		const aAddr = randomAddress();
		const bAddr = randomAddress();

		// Vault A: concentrated (1 market) but good governance (7d timelock)
		const vaultA = createMockVault({
			address: aAddr,
			timelock: 604800n,
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 500_000n,
						lltv: 800000000000000000n,
					},
				},
			],
		});

		// Vault B: diversified (3 markets) but no governance (0 timelock)
		const bOracle1 = randomAddress();
		const bOracle2 = randomAddress();
		const bOracle3 = randomAddress();

		const vaultB = createMockVault({
			address: bAddr,
			timelock: 0n,
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 500_000n,
						lltv: 800000000000000000n,
						oracle: bOracle1,
					},
				},
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 500_000n,
						lltv: 800000000000000000n,
						oracle: bOracle2,
					},
				},
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 500_000n,
						lltv: 800000000000000000n,
						oracle: bOracle3,
					},
				},
			],
		});

		const result = compareVaults([vaultA, vaultB]);

		const findRank = (
			rankings: ReadonlyArray<{ vault: Address; rank: number }>,
			addr: Address,
		) => rankings.find((r) => r.vault === addr)?.rank;

		// B ranks better on concentration (lower HHI)
		expect(findRank(result.rankings.concentration, bAddr)).toBe(1);
		expect(findRank(result.rankings.concentration, aAddr)).toBe(2);

		// A ranks better on governance (longer timelock)
		expect(findRank(result.rankings.governance, aAddr)).toBe(1);
		expect(findRank(result.rankings.governance, bAddr)).toBe(2);
	});
});

describe("error propagation", () => {
	beforeEach(() => resetAddressCounter());

	test("analyzeVault throws ZeroTotalAssetsError for zero-supply vault", () => {
		const vault = createMockVault({
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 500_000n,
					},
					supplyShares: 0n,
				},
			],
		});

		expect(() => analyzeVault(vault)).toThrow(ZeroTotalAssetsError);
	});

	test("compareVaults propagates error from any vault in the list", () => {
		const valid = createMockVault({
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 500_000n,
					},
				},
			],
		});

		const broken = createMockVault({
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 500_000n,
					},
					supplyShares: 0n,
				},
			],
		});

		expect(() => compareVaults([valid, broken])).toThrow(ZeroTotalAssetsError);
	});
});
