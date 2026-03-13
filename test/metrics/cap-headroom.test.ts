import { MathLib } from "@morpho-org/blue-sdk";
import { beforeEach, describe, expect, test } from "vitest";
import { computeCapHeadroom } from "../../src/metrics/cap-headroom.js";
import { createMockVault, resetAddressCounter } from "../fixtures.js";

describe("computeCapHeadroom", () => {
	beforeEach(() => resetAddressCounter());

	test("unlimited cap markets are marked as unlimited", () => {
		const vault = createMockVault({
			allocations: [{ market: {}, cap: MathLib.MAX_UINT_256 }],
		});

		const result = computeCapHeadroom(vault);
		expect(result.markets[0]?.isUnlimited).toBe(true);
		expect(result.tightest).toBeNull();
	});

	test("zero cap is treated as unlimited", () => {
		const vault = createMockVault({
			allocations: [{ market: {}, cap: 0n }],
		});

		const result = computeCapHeadroom(vault);
		expect(result.markets[0]?.isUnlimited).toBe(true);
	});

	test("market at cap has zero remaining capacity", () => {
		// Default supply is ~500B. Set cap below that.
		const vault = createMockVault({
			allocations: [{ market: {}, cap: 100n }],
		});

		const result = computeCapHeadroom(vault);
		expect(result.markets[0]?.remainingCapacity).toBe(0n);
		expect(result.markets[0]?.isUnlimited).toBe(false);
	});

	test("tightest is the market closest to cap", () => {
		const supply = 1_000_000_000_000n;
		const vault = createMockVault({
			allocations: [
				{
					market: {},
					cap: supply * 10n, // Lots of headroom
				},
				{
					market: {},
					cap: supply, // Tight - supply is close to cap
				},
			],
		});

		const result = computeCapHeadroom(vault);
		expect(result.tightest).not.toBeNull();
		// The tighter market should have higher utilization
		const cappedMarkets = result.markets.filter((m) => !m.isUnlimited);
		const tightest = cappedMarkets.reduce((max, m) =>
			m.utilization > max.utilization ? m : max,
		);
		expect(result.tightest?.marketId).toBe(tightest.marketId);
	});

	test("unlimited markets are excluded from tightest", () => {
		const vault = createMockVault({
			allocations: [
				{ market: {}, cap: MathLib.MAX_UINT_256 },
				{ market: {}, cap: 1_000_000_000_000n },
			],
		});

		const result = computeCapHeadroom(vault);
		expect(result.tightest).not.toBeNull();
		expect(result.tightest?.isUnlimited).toBe(false);
	});
});
