import { beforeEach, describe, expect, test } from "vitest";
import { compareVaults } from "../src/compare.js";
import { createMockVault, resetAddressCounter } from "./fixtures.js";

describe("compareVaults", () => {
	beforeEach(() => resetAddressCounter());

	test("ranks concentrated vault worse than diversified", () => {
		const concentrated = createMockVault({
			allocations: [{ market: {} }],
			address: "0x0000000000000000000000000000000000000001",
		});

		const diversified = createMockVault({
			allocations: [{ market: {} }, { market: {} }, { market: {} }],
			address: "0x0000000000000000000000000000000000000002",
		});

		const result = compareVaults([concentrated, diversified]);
		expect(result.vaults).toHaveLength(2);

		// Diversified vault should rank better (lower rank number) for concentration
		const concRankings = result.rankings.concentration;
		const diversifiedRank = concRankings.find(
			(r) => r.vault === diversified.address,
		);
		const concentratedRank = concRankings.find(
			(r) => r.vault === concentrated.address,
		);
		expect(diversifiedRank!.rank).toBeLessThan(concentratedRank!.rank);
	});

	test("ranks longer timelock as better governance", () => {
		const noTimelock = createMockVault({
			allocations: [{ market: {} }],
			timelock: 0n,
			address: "0x0000000000000000000000000000000000000001",
		});

		const longTimelock = createMockVault({
			allocations: [{ market: {} }],
			timelock: 604800n,
			address: "0x0000000000000000000000000000000000000002",
		});

		const result = compareVaults([noTimelock, longTimelock]);

		const govRankings = result.rankings.governance;
		const longRank = govRankings.find((r) => r.vault === longTimelock.address);
		const noRank = govRankings.find((r) => r.vault === noTimelock.address);
		expect(longRank!.rank).toBeLessThan(noRank!.rank);
	});

	test("all ranking arrays have correct length", () => {
		const vaults = [
			createMockVault({
				allocations: [{ market: {} }],
				address: "0x0000000000000000000000000000000000000001",
			}),
			createMockVault({
				allocations: [{ market: {} }],
				address: "0x0000000000000000000000000000000000000002",
			}),
			createMockVault({
				allocations: [{ market: {} }],
				address: "0x0000000000000000000000000000000000000003",
			}),
		];

		const result = compareVaults(vaults);

		for (const rankings of Object.values(result.rankings)) {
			expect(rankings).toHaveLength(3);
		}
	});
});
