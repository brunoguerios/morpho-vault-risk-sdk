import { beforeEach, describe, expect, test } from "vitest";
import { ZeroTotalAssetsError } from "../../src/errors.js";
import { computeConcentration } from "../../src/metrics/concentration.js";
import { createMockVault, resetAddressCounter } from "../fixtures.js";

describe("computeConcentration", () => {
	beforeEach(() => resetAddressCounter());

	test("single market vault has HHI = 1", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }],
		});

		const result = computeConcentration(vault);
		expect(result.hhi).toBeCloseTo(1, 5);
		expect(result.activeMarketCount).toBe(1);
		expect(result.effectiveMarketCount).toBeCloseTo(1, 5);
	});

	test("two equal markets have HHI ~ 0.5", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }, { market: {} }],
		});

		const result = computeConcentration(vault);
		expect(result.hhi).toBeCloseTo(0.5, 2);
		expect(result.activeMarketCount).toBe(2);
		expect(result.effectiveMarketCount).toBeCloseTo(2, 2);
	});

	test("four equal markets have HHI ~ 0.25", () => {
		const vault = createMockVault({
			allocations: [
				{ market: {} },
				{ market: {} },
				{ market: {} },
				{ market: {} },
			],
		});

		const result = computeConcentration(vault);
		expect(result.hhi).toBeCloseTo(0.25, 2);
		expect(result.effectiveMarketCount).toBeCloseTo(4, 2);
	});

	test("unequal allocations have HHI > equal case", () => {
		const big = 9_000_000_000_000n;
		const small = 1_000_000_000_000n;
		const vault = createMockVault({
			allocations: [
				{
					market: { totalSupplyAssets: big },
					supplyShares: (big * 1_000_000n) / 2n,
				},
				{
					market: { totalSupplyAssets: small },
					supplyShares: (small * 1_000_000n) / 2n,
				},
			],
		});

		const result = computeConcentration(vault);
		expect(result.hhi).toBeGreaterThan(0.5);
		expect(result.marketProportions[0]?.proportion).toBeGreaterThan(
			result.marketProportions[1]?.proportion,
		);
	});

	test("proportions are sorted descending", () => {
		const big = 9_000_000_000_000n;
		const small = 1_000_000_000_000n;
		const vault = createMockVault({
			allocations: [
				{
					market: { totalSupplyAssets: small },
					supplyShares: (small * 1_000_000n) / 2n,
				},
				{
					market: { totalSupplyAssets: big },
					supplyShares: (big * 1_000_000n) / 2n,
				},
			],
		});

		const result = computeConcentration(vault);
		expect(result.marketProportions[0]?.proportion).toBeGreaterThan(
			result.marketProportions[1]?.proportion,
		);
	});

	test("throws ZeroTotalAssetsError for empty vault", () => {
		const vault = createMockVault({
			allocations: [{ market: {}, supplyShares: 0n }],
		});

		expect(() => computeConcentration(vault)).toThrow(ZeroTotalAssetsError);
	});
});
