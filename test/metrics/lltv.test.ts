import { beforeEach, describe, expect, test } from "vitest";
import { NoActiveMarketsError } from "../../src/errors.js";
import { computeLltvRange } from "../../src/metrics/lltv.js";
import { createMockVault, resetAddressCounter } from "../fixtures.js";

describe("computeLltvRange", () => {
	beforeEach(() => resetAddressCounter());

	test("single market returns that market's LLTV", () => {
		const lltv = 860000000000000000n; // 86%
		const vault = createMockVault({
			allocations: [{ market: { lltv } }],
		});

		const result = computeLltvRange(vault);
		expect(result.min).toBe(lltv);
		expect(result.max).toBe(lltv);
		expect(result.weightedAvg).toBe(lltv);
		expect(result.distinctValues).toEqual([lltv]);
	});

	test("multiple LLTVs return correct min/max", () => {
		const vault = createMockVault({
			allocations: [
				{ market: { lltv: 770000000000000000n } }, // 77%
				{ market: { lltv: 860000000000000000n } }, // 86%
				{ market: { lltv: 945000000000000000n } }, // 94.5%
			],
		});

		const result = computeLltvRange(vault);
		expect(result.min).toBe(770000000000000000n);
		expect(result.max).toBe(945000000000000000n);
		expect(result.distinctValues).toHaveLength(3);
	});

	test("distinctValues are sorted ascending", () => {
		const vault = createMockVault({
			allocations: [
				{ market: { lltv: 945000000000000000n } },
				{ market: { lltv: 770000000000000000n } },
			],
		});

		const result = computeLltvRange(vault);
		const [first, second] = result.distinctValues;
		expect(first !== undefined && second !== undefined && first < second).toBe(
			true,
		);
	});

	test("throws NoActiveMarketsError for idle-only vault", () => {
		const vault = createMockVault({
			allocations: [
				{
					market: {
						collateralToken: "0x0000000000000000000000000000000000000000",
						lltv: 0n,
					},
				},
			],
		});

		expect(() => computeLltvRange(vault)).toThrow(NoActiveMarketsError);
	});
});
