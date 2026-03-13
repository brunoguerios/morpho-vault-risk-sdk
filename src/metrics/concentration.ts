import type { AccrualVault, MarketId } from "@morpho-org/blue-sdk";
import { formatEther } from "viem";
import { ZeroTotalAssetsError } from "../errors.js";
import type { ConcentrationAnalysis } from "../types.js";

/**
 * Computes the Herfindahl-Hirschman Index (HHI) over a vault's market allocations.
 *
 * HHI = 0 means perfectly diversified, HHI = 1 means single-market concentration.
 * effectiveMarketCount = 1/HHI gives the equivalent number of equally-weighted markets.
 *
 * @throws {ZeroTotalAssetsError} if the vault has zero total assets.
 */
export function computeConcentration(
	vault: AccrualVault,
): ConcentrationAnalysis {
	if (vault.totalAssets === 0n) {
		throw new ZeroTotalAssetsError(vault.address);
	}

	const proportions: {
		marketId: MarketId;
		proportion: number;
	}[] = [];

	for (const [marketId, allocation] of vault.allocations) {
		const propWad = vault.getAllocationProportion(marketId);
		const prop = +formatEther(propWad);

		if (allocation.position.supplyAssets > 0n) {
			proportions.push({ marketId, proportion: prop });
		}
	}

	proportions.sort((a, b) => b.proportion - a.proportion);

	const hhi = proportions.reduce(
		(sum, { proportion }) => sum + proportion * proportion,
		0,
	);
	const activeMarketCount = proportions.length;
	const effectiveMarketCount = hhi > 0 ? 1 / hhi : 0;

	return {
		hhi,
		activeMarketCount,
		effectiveMarketCount,
		marketProportions: proportions,
	};
}
