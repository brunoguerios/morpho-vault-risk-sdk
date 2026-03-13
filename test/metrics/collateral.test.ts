import type { Address } from "@morpho-org/blue-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import { computeCollateralDiversity } from "../../src/metrics/collateral.js";
import { createMockVault, resetAddressCounter } from "../fixtures.js";

const COLLATERAL_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
const COLLATERAL_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address;

describe("computeCollateralDiversity", () => {
	beforeEach(() => resetAddressCounter());

	test("single collateral has HHI = 1", () => {
		const vault = createMockVault({
			allocations: [
				{
					market: { collateralToken: COLLATERAL_A, lltv: 860000000000000000n },
				},
				{
					market: { collateralToken: COLLATERAL_A, lltv: 770000000000000000n },
				},
			],
		});

		const result = computeCollateralDiversity(vault);
		expect(result.distinctCount).toBe(1);
		expect(result.hhi).toBeCloseTo(1, 2);
		expect(result.collaterals[0]?.marketCount).toBe(2);
		expect(result.collaterals[0]?.lltvs).toHaveLength(2);
	});

	test("two equal collaterals have HHI = 0.5", () => {
		const vault = createMockVault({
			allocations: [
				{ market: { collateralToken: COLLATERAL_A } },
				{ market: { collateralToken: COLLATERAL_B } },
			],
		});

		const result = computeCollateralDiversity(vault);
		expect(result.distinctCount).toBe(2);
		expect(result.hhi).toBeCloseTo(0.5, 2);
	});

	test("collaterals are sorted by proportion descending", () => {
		const supply1 = 3_000_000_000_000n;
		const supply2 = 1_000_000_000_000n;
		const vault = createMockVault({
			allocations: [
				{
					market: { collateralToken: COLLATERAL_A, totalSupplyAssets: supply1 },
					supplyShares: (supply1 * 1_000_000n) / 2n,
				},
				{
					market: { collateralToken: COLLATERAL_B, totalSupplyAssets: supply2 },
					supplyShares: (supply2 * 1_000_000n) / 2n,
				},
			],
		});

		const result = computeCollateralDiversity(vault);
		expect(result.collaterals[0]?.proportion).toBeGreaterThan(
			result.collaterals[1]?.proportion,
		);
	});
});
