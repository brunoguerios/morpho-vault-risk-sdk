import type { Address } from "@morpho-org/blue-sdk";
import { describe, test } from "vitest";
import {
	createMockMarket,
	createMockVault,
	resetAddressCounter,
} from "./fixtures.js";

const ORACLE_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as Address;
const ORACLE_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as Address;

describe("debug", () => {
	test("check market.id", () => {
		resetAddressCounter();
		const m1 = createMockMarket({ oracle: ORACLE_A });
		const m2 = createMockMarket({ oracle: ORACLE_B });
		console.log("m1.id:", m1.id);
		console.log("m2.id:", m2.id);
		console.log("m1.params.id:", m1.params.id);
		console.log(
			"m1.params:",
			JSON.stringify(m1.params, (_, v) =>
				typeof v === "bigint" ? v.toString() : v,
			),
		);
		console.log(
			"m2.params:",
			JSON.stringify(m2.params, (_, v) =>
				typeof v === "bigint" ? v.toString() : v,
			),
		);
		console.log("same id?", m1.id === m2.id);
	});

	test("trace mock vault internals", () => {
		resetAddressCounter();
		const vault = createMockVault({
			allocations: [
				{ market: { oracle: ORACLE_A } },
				{ market: { oracle: ORACLE_B } },
			],
		});

		console.log("totalAssets:", vault.totalAssets);
		console.log("allocations size:", vault.allocations.size);
		for (const [marketId, alloc] of vault.allocations) {
			console.log("---");
			console.log("marketId:", marketId);
			console.log("market.id:", alloc.position.market.id);
			console.log("oracle:", alloc.position.market.params.oracle);
			console.log("collateral:", alloc.position.market.params.collateralToken);
			console.log("supplyAssets:", alloc.position.supplyAssets);
		}
	});
});
