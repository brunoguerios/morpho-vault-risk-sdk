/**
 * Multi-vault comparison example.
 *
 * Demonstrates how to use `compareVaults` to rank multiple vaults
 * across different risk metrics. Rank 1 = best (least risky).
 * 
 * Usage:
 *   npx tsx examples/compare-vaults.ts
 */
import { type Address } from "@morpho-org/blue-sdk";
import { compareVaults } from "../src/index.js";
import { createMockVault, randomAddress } from "../test/fixtures.js";

// --- Build three vaults with distinct risk profiles ---

const safeAddr = randomAddress();
const mediumAddr = randomAddress();
const riskyAddr = randomAddress();

// Safe vault: diversified, conservative LLTVs, strong governance
const safe = createMockVault({
	address: safeAddr,
	timelock: 604800n, // 7 days
	guardian: randomAddress(),
	curator: randomAddress(),
	allocations: Array.from({ length: 4 }, () => ({
		market: {
			totalSupplyAssets: 1_000_000n,
			totalBorrowAssets: 200_000n, // 20% utilization
			lltv: 500000000000000000n, // 50%
			oracle: randomAddress(),
			collateralToken: randomAddress(),
		},
	})),
});

// Medium vault: moderate diversification and governance
const medium = createMockVault({
	address: mediumAddr,
	timelock: 86400n, // 1 day
	allocations: Array.from({ length: 2 }, () => ({
		market: {
			totalSupplyAssets: 1_000_000n,
			totalBorrowAssets: 500_000n, // 50% utilization
			lltv: 750000000000000000n, // 75%
			oracle: randomAddress(),
			collateralToken: randomAddress(),
		},
	})),
});

// Risky vault: single market, high LLTV, no governance
const risky = createMockVault({
	address: riskyAddr,
	timelock: 0n,
	allocations: [
		{
			market: {
				totalSupplyAssets: 1_000_000n,
				totalBorrowAssets: 900_000n, // 90% utilization
				lltv: 945000000000000000n, // 94.5%
			},
		},
	],
});

// --- Compare all three ---

const result = compareVaults([safe, medium, risky]);

// Label map for readable output
const labels = new Map<Address, string>([
	[safeAddr, "Safe"],
	[mediumAddr, "Medium"],
	[riskyAddr, "Risky"],
]);

console.log("=== Vault Rankings (1 = best) ===\n");

for (const [metric, rankings] of Object.entries(result.rankings)) {
	console.log(`${metric}:`);
	for (const entry of rankings) {
		console.log(`  #${entry.rank} — ${labels.get(entry.vault)} (${entry.vault.slice(0, 10)}...)`);
	}
}

// --- Look up a specific vault's rank ---

console.log("\n=== Lookup: Safe vault concentration rank ===");
const safeConcentrationRank = result.rankings.concentration.find(
	(r) => r.vault === safeAddr,
);
console.log(`  Rank: ${safeConcentrationRank?.rank}`);
