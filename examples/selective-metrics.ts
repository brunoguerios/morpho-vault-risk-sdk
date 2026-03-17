/**
 * Selective metrics example.
 *
 * Shows how to use individual metric functions when you only need
 * a subset of the full analysis. This avoids computing unnecessary
 * metrics and keeps the result types focused.
 *
 * Usage:
 *   npx tsx examples/selective-metrics.ts
 */
import {
	computeConcentration,
	computeGovernance,
	computeLiquidityCoverage,
	computeUtilizationExposure,
} from "../src/index.js";
import { createMockVault } from "../test/fixtures.js";

const vault = createMockVault({
	timelock: 0n, // no timelock
	allocations: [
		{
			market: {
				totalSupplyAssets: 5_000_000n,
				totalBorrowAssets: 4_500_000n, // 90% utilization
			},
		},
	],
});

// Compute only the metrics you care about
const concentration = computeConcentration(vault);
const governance = computeGovernance(vault);
const liquidity = computeLiquidityCoverage(vault);
const utilization = computeUtilizationExposure(vault);

// Use results for conditional risk alerts
if (concentration.squaredProportionsSum > 0.5) {
	console.log(
		`WARNING: Vault is heavily concentrated (${concentration.squaredProportionsSum.toFixed(2)}, ` +
			`${concentration.activeMarketCount} market(s))`,
	);
}

if (governance.timelockTier === "none") {
	console.log(
		"WARNING: No timelock — governance changes take effect immediately",
	);
}

if (liquidity.ratio < 0.1) {
	console.log(
		`WARNING: Low liquidity — only ${(liquidity.ratio * 100).toFixed(1)}% of assets can be withdrawn instantly`,
	);
}

if (utilization.max > 0.9) {
	console.log(
		`WARNING: High utilization — worst market at ${(utilization.max * 100).toFixed(1)}%`,
	);
}
