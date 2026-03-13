import { type AccrualVault, MathLib } from "@morpho-org/blue-sdk";
import { formatEther } from "viem";
import type { CapHeadroomAnalysis, MarketCapHeadroom } from "../types.js";

/**
 * Computes per-market distance to allocation cap.
 *
 * Markets with `cap === 0n` are treated as unlimited (the VaultMarketAllocation
 * getter returns MAX_UINT_256 for utilization in that case).
 */
export function computeCapHeadroom(vault: AccrualVault): CapHeadroomAnalysis {
	const markets: MarketCapHeadroom[] = [];

	for (const [marketId, allocation] of vault.allocations) {
		const cap = allocation.config.cap;
		const isUnlimited = cap === 0n || cap === MathLib.MAX_UINT_256;
		const supplyAssets = allocation.position.supplyAssets;

		const utilization = isUnlimited ? 0n : allocation.utilization;
		const remainingCapacity = isUnlimited
			? MathLib.MAX_UINT_256
			: MathLib.zeroFloorSub(cap, supplyAssets);

		markets.push({
			marketId,
			utilization,
			remainingCapacity,
			isUnlimited,
		});
	}

	const capped = markets.filter((m) => !m.isUnlimited);
	const tightest =
		capped.length > 0
			? capped.reduce((max, m) => (m.utilization > max.utilization ? m : max))
			: null;

	let weightedAvgUtilization = 0;
	if (capped.length > 0 && vault.totalAssets > 0n) {
		let weightedSum = 0;
		let totalWeight = 0;
		for (const m of capped) {
			const allocation = vault.allocations.get(m.marketId);
			if (!allocation) continue;
			const weight = +formatEther(
				MathLib.wDivDown(allocation.position.supplyAssets, vault.totalAssets),
			);
			weightedSum += +formatEther(m.utilization) * weight;
			totalWeight += weight;
		}
		weightedAvgUtilization = totalWeight > 0 ? weightedSum / totalWeight : 0;
	}

	return { markets, tightest, weightedAvgUtilization };
}
