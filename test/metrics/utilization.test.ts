import { beforeEach, describe, expect, test } from "vitest";
import { computeUtilizationExposure } from "../../src/metrics/utilization.js";
import { createMockVault, resetAddressCounter } from "../fixtures.js";

describe("computeUtilizationExposure", () => {
	beforeEach(() => resetAddressCounter());

	test("single market with 80% utilization", () => {
		const vault = createMockVault({
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 800_000n,
					},
				},
			],
		});

		const result = computeUtilizationExposure(vault);
		expect(result.weightedAvg).toBeCloseTo(0.8, 2);
		expect(result.max).toBeCloseTo(0.8, 2);
		expect(result.perMarket).toHaveLength(1);
	});

	test("weighted average reflects allocation proportions", () => {
		// Both markets same size, but one at 90% util and one at 10%
		// With equal allocation, weighted avg should be ~50%
		const vault = createMockVault({
			allocations: [
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 900_000n,
					},
				},
				{
					market: {
						totalSupplyAssets: 1_000_000n,
						totalBorrowAssets: 100_000n,
					},
				},
			],
		});

		const result = computeUtilizationExposure(vault);
		expect(result.weightedAvg).toBeCloseTo(0.5, 1);
		expect(result.max).toBeCloseTo(0.9, 2);
	});

	test("empty vault returns zero utilization", () => {
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

		const result = computeUtilizationExposure(vault);
		expect(result.weightedAvg).toBe(0);
	});
});
