import type { AccrualVault } from "@morpho-org/blue-sdk";
import { formatEther } from "viem";
import type { CollateralDiversityAnalysis } from "../types.js";

/**
 * Computes collateral token diversity across the vault's market allocations.
 *
 * Uses the pre-computed `vault.collateralAllocations` map which groups markets
 * by collateral token with proportion, LLTVs, oracles, and market count.
 *
 * Sum of squared collateral proportions: 0 = diverse, 1 = single collateral.
 */
export function computeCollateralDiversity(
	vault: AccrualVault,
): CollateralDiversityAnalysis {
	const collaterals: CollateralDiversityAnalysis["collaterals"][number][] = [];

	for (const [address, collateralAllocation] of vault.collateralAllocations) {
		const proportion = +formatEther(collateralAllocation.proportion);
		collaterals.push({
			address,
			proportion,
			marketCount: collateralAllocation.markets.size,
			lltvs: [...collateralAllocation.lltvs].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)),
		});
	}

	collaterals.sort((a, b) => b.proportion - a.proportion);

	const squaredProportionsSum = collaterals.reduce(
		(sum, { proportion }) => sum + proportion * proportion,
		0,
	);

	return {
		distinctCount: collaterals.length,
		collaterals,
		squaredProportionsSum,
	};
}
