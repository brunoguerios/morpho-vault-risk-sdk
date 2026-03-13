import { beforeEach, describe, expect, test } from "vitest";
import { computeGovernance } from "../../src/metrics/governance.js";
import {
	createMockVault,
	randomAddress,
	resetAddressCounter,
} from "../fixtures.js";

describe("computeGovernance", () => {
	beforeEach(() => resetAddressCounter());

	test("zero timelock is tier 'none'", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }],
			timelock: 0n,
		});

		const result = computeGovernance(vault);
		expect(result.timelockTier).toBe("none");
		expect(result.timelockSeconds).toBe(0n);
	});

	test("12 hour timelock is tier 'short'", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }],
			timelock: 43200n, // 12 hours
		});

		const result = computeGovernance(vault);
		expect(result.timelockTier).toBe("short");
	});

	test("3 day timelock is tier 'medium'", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }],
			timelock: 259200n, // 3 days
		});

		const result = computeGovernance(vault);
		expect(result.timelockTier).toBe("medium");
	});

	test("7 day timelock is tier 'long'", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }],
			timelock: 604800n, // 7 days
		});

		const result = computeGovernance(vault);
		expect(result.timelockTier).toBe("long");
	});

	test("detects guardian presence", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }],
			guardian: randomAddress(),
		});

		const result = computeGovernance(vault);
		expect(result.hasGuardian).toBe(true);
	});

	test("detects missing guardian", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }],
			guardian: "0x0000000000000000000000000000000000000000",
		});

		const result = computeGovernance(vault);
		expect(result.hasGuardian).toBe(false);
	});

	test("detects curator presence", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }],
			curator: randomAddress(),
		});

		const result = computeGovernance(vault);
		expect(result.hasCurator).toBe(true);
	});

	test("reports fee", () => {
		const fee = 100000000000000000n; // 10%
		const vault = createMockVault({
			allocations: [{ market: {} }],
			fee,
		});

		const result = computeGovernance(vault);
		expect(result.fee).toBe(fee);
	});
});
