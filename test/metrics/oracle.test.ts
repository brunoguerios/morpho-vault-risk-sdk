import type { Address } from "@morpho-org/blue-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import { computeOracleConcentration } from "../../src/metrics/oracle.js";
import { createMockVault, resetAddressCounter } from "../fixtures.js";

// Use explicit addresses to avoid counter collision with fixture internals
const ORACLE_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
const ORACLE_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address;
const ORACLE_C = "0xcccccccccccccccccccccccccccccccccccccccc" as Address;

describe("computeOracleConcentration", () => {
	beforeEach(() => resetAddressCounter());

	test("single oracle is dominant", () => {
		const vault = createMockVault({
			allocations: [
				{ market: { oracle: ORACLE_A } },
				{ market: { oracle: ORACLE_A } },
			],
		});

		const result = computeOracleConcentration(vault);
		expect(result.distinctCount).toBe(1);
		expect(result.isSingleOracleDominant).toBe(true);
	});

	test("diverse oracles are not dominant", () => {
		const vault = createMockVault({
			allocations: [
				{ market: { oracle: ORACLE_A } },
				{ market: { oracle: ORACLE_B } },
				{ market: { oracle: ORACLE_C } },
			],
		});

		const result = computeOracleConcentration(vault);
		expect(result.distinctCount).toBe(3);
		expect(result.isSingleOracleDominant).toBe(false);
	});

	test("respects custom dominance threshold", () => {
		const supply1 = 3_000_000_000_000n;
		const supply2 = 1_000_000_000_000n;
		const vault = createMockVault({
			allocations: [
				{
					market: { oracle: ORACLE_A, totalSupplyAssets: supply1 },
					supplyShares: (supply1 * 1_000_000n) / 2n,
				},
				{
					market: { oracle: ORACLE_B, totalSupplyAssets: supply2 },
					supplyShares: (supply2 * 1_000_000n) / 2n,
				},
			],
		});

		// ~75% with default 50% threshold → dominant
		expect(computeOracleConcentration(vault, 0.5).isSingleOracleDominant).toBe(
			true,
		);
		// ~75% with 80% threshold → not dominant
		expect(computeOracleConcentration(vault, 0.8).isSingleOracleDominant).toBe(
			false,
		);
	});

	test("exposure proportions sum to ~1", () => {
		const vault = createMockVault({
			allocations: [
				{ market: { oracle: ORACLE_A } },
				{ market: { oracle: ORACLE_B } },
			],
		});

		const result = computeOracleConcentration(vault);
		const sum = result.exposure.reduce((s, e) => s + e.proportion, 0);
		expect(sum).toBeCloseTo(1, 2);
	});
});
