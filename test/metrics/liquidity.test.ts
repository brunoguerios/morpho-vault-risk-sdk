import { beforeEach, describe, expect, test } from "vitest";
import { computeLiquidityCoverage } from "../../src/metrics/liquidity.js";
import { createMockVault, resetAddressCounter } from "../fixtures.js";

describe("computeLiquidityCoverage", () => {
	beforeEach(() => resetAddressCounter());

	test("returns ratio = 1 for empty vault", () => {
		const vault = createMockVault({
			allocations: [{ market: { totalSupplyAssets: 100n }, supplyShares: 0n }],
		});

		const result = computeLiquidityCoverage(vault);
		expect(result.ratio).toBe(1);
		expect(result.totalAssets).toBe(0n);
	});

	test("fully liquid market has ratio close to 1", () => {
		// Market with supply but no borrows = full liquidity
		const vault = createMockVault({
			allocations: [
				{
					market: {
						totalSupplyAssets: 1000000n,
						totalBorrowAssets: 0n,
					},
				},
			],
		});

		const result = computeLiquidityCoverage(vault);
		expect(result.ratio).toBeGreaterThan(0.9);
	});

	test("high utilization market has lower ratio", () => {
		// Market with 95% borrowed = only 5% liquid
		const vault = createMockVault({
			allocations: [
				{
					market: {
						totalSupplyAssets: 1000000n,
						totalBorrowAssets: 950000n,
					},
				},
			],
		});

		const result = computeLiquidityCoverage(vault);
		expect(result.ratio).toBeLessThan(0.2);
	});

	test("ratio is capped at 1", () => {
		const vault = createMockVault({
			allocations: [
				{
					market: {
						totalSupplyAssets: 1000000n,
						totalBorrowAssets: 0n,
					},
				},
			],
		});

		const result = computeLiquidityCoverage(vault);
		expect(result.ratio).toBeLessThanOrEqual(1);
	});
});
