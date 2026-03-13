import { beforeEach, describe, expect, test } from "vitest";
import { analyzeVault } from "../src/analyze.js";
import {
	createMockVault,
	randomAddress,
	resetAddressCounter,
} from "./fixtures.js";

describe("analyzeVault", () => {
	beforeEach(() => resetAddressCounter());

	test("returns all metric sections", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }, { market: {} }],
			timelock: 86400n,
			guardian: randomAddress(),
			curator: randomAddress(),
			fee: 100000000000000000n,
		});

		const result = analyzeVault(vault);

		expect(result.vault).toBe(vault.address);
		expect(result.timestamp).toBeGreaterThan(0);
		expect(result.concentration).toBeDefined();
		expect(result.liquidityCoverage).toBeDefined();
		expect(result.capHeadroom).toBeDefined();
		expect(result.utilizationExposure).toBeDefined();
		expect(result.lltv).toBeDefined();
		expect(result.oracle).toBeDefined();
		expect(result.collateralDiversity).toBeDefined();
		expect(result.governance).toBeDefined();
	});

	test("metrics are internally consistent", () => {
		const vault = createMockVault({
			allocations: [{ market: {} }, { market: {} }, { market: {} }],
		});

		const result = analyzeVault(vault);

		// 3 markets should give concentration < 1
		expect(result.concentration.activeMarketCount).toBe(3);
		expect(result.concentration.squaredProportionsSum).toBeLessThan(1);

		// 3 different collaterals should give diversity squaredProportionsSum < 1
		expect(result.collateralDiversity.distinctCount).toBe(3);
	});
});
