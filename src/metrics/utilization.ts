import { type AccrualVault, MathLib } from "@morpho-org/blue-sdk";
import { formatEther } from "viem";
import type { UtilizationExposureAnalysis } from "../types.js";

/**
 * Computes the weighted-average borrow utilization across the vault's market allocations.
 *
 * Each market's utilization (totalBorrowAssets / totalSupplyAssets) is weighted
 * by the vault's proportion of assets in that market.
 */
export function computeUtilizationExposure(
	vault: AccrualVault,
): UtilizationExposureAnalysis {
	const totalAssets = vault.totalAssets;
	const perMarket: UtilizationExposureAnalysis["perMarket"][number][] = [];
	let weightedSum = 0;
	let maxUtilization = 0;

	for (const [marketId, allocation] of vault.allocations) {
		const marketUtil = +formatEther(allocation.position.market.utilization);
		const weight =
			totalAssets > 0n
				? +formatEther(
						MathLib.wDivDown(allocation.position.supplyAssets, totalAssets),
					)
				: 0;

		perMarket.push({ marketId, utilization: marketUtil, weight });
		weightedSum += marketUtil * weight;
		maxUtilization = Math.max(maxUtilization, marketUtil);
	}

	return {
		weightedAvg: weightedSum,
		perMarket,
		max: maxUtilization,
	};
}
