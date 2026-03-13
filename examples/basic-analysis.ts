/**
 * Basic vault risk analysis example.
 *
 * Demonstrates how to use `analyzeVault` to compute all risk metrics
 * for a single Morpho vault in one call.
 */
import { analyzeVault } from "../src/index.js";
import { createMockVault, randomAddress } from "../test/fixtures.js";

// --- Build a realistic 3-market vault ---

const oracle1 = randomAddress();
const oracle2 = randomAddress();
const oracle3 = randomAddress();

const vault = createMockVault({
	timelock: 86400n, // 1-day timelock
	guardian: randomAddress(),
	curator: randomAddress(),
	fee: 100000000000000000n, // 10% performance fee (WAD-scaled)
	allocations: [
		{
			market: {
				totalSupplyAssets: 5_000_000n,
				totalBorrowAssets: 4_000_000n, // 80% utilization
				lltv: 860000000000000000n, // 86% LLTV
				oracle: oracle1,
			},
		},
		{
			market: {
				totalSupplyAssets: 3_000_000n,
				totalBorrowAssets: 900_000n, // 30% utilization
				lltv: 770000000000000000n, // 77% LLTV
				oracle: oracle2,
			},
		},
		{
			market: {
				totalSupplyAssets: 2_000_000n,
				totalBorrowAssets: 1_000_000n, // 50% utilization
				lltv: 650000000000000000n, // 65% LLTV
				oracle: oracle3,
			},
		},
	],
});

// --- Run the full analysis ---

const result = analyzeVault(vault);

// Concentration: how diversified is the vault across markets?
// HHI = 0 means perfectly diversified, HHI = 1 means single market.
console.log("=== Concentration ===");
console.log(`  HHI: ${result.concentration.hhi.toFixed(3)}`);
console.log(`  Active markets: ${result.concentration.activeMarketCount}`);
console.log(`  Effective market count: ${result.concentration.effectiveMarketCount.toFixed(1)}`);

// Liquidity: what fraction of assets can be withdrawn instantly?
console.log("\n=== Liquidity Coverage ===");
console.log(`  Ratio: ${(result.liquidityCoverage.ratio * 100).toFixed(1)}%`);

// Utilization: how much of the supplied assets are being borrowed?
console.log("\n=== Utilization Exposure ===");
console.log(`  Weighted avg: ${(result.utilizationExposure.weightedAvg * 100).toFixed(1)}%`);
console.log(`  Max single market: ${(result.utilizationExposure.max * 100).toFixed(1)}%`);

// LLTV: liquidation loan-to-value thresholds across markets (WAD-scaled)
console.log("\n=== LLTV Range ===");
console.log(`  Min: ${result.lltv.min}`);
console.log(`  Max: ${result.lltv.max}`);
console.log(`  Weighted avg: ${result.lltv.weightedAvg}`);
console.log(`  Distinct values: ${result.lltv.distinctValues.length}`);

// Oracle diversity: are assets spread across multiple price oracles?
console.log("\n=== Oracle Concentration ===");
console.log(`  Distinct oracles: ${result.oracle.distinctCount}`);
console.log(`  Single oracle dominant: ${result.oracle.isSingleOracleDominant}`);

// Collateral diversity: how many different collateral tokens back the vault?
console.log("\n=== Collateral Diversity ===");
console.log(`  Distinct collaterals: ${result.collateralDiversity.distinctCount}`);
console.log(`  HHI: ${result.collateralDiversity.hhi.toFixed(3)}`);

// Governance: timelock, guardian, curator, and fees
console.log("\n=== Governance ===");
console.log(`  Timelock: ${result.governance.timelockSeconds}s (${result.governance.timelockTier})`);
console.log(`  Guardian set: ${result.governance.hasGuardian}`);
console.log(`  Curator set: ${result.governance.hasCurator}`);
console.log(`  Fee: ${result.governance.fee}`);

// Cap headroom: how close are markets to their allocation caps?
console.log("\n=== Cap Headroom ===");
console.log(`  Weighted avg utilization: ${(result.capHeadroom.weightedAvgUtilization * 100).toFixed(1)}%`);
console.log(`  Tightest market: ${result.capHeadroom.tightest?.marketId ?? "none (all unlimited)"}`);
