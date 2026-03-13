import type { AccrualVault } from "@morpho-org/blue-sdk";
import { MathLib } from "@morpho-org/blue-sdk";
import { formatEther } from "viem";
import type { LiquidityCoverageAnalysis } from "../types.js";

/**
 * Computes the fraction of vault assets that can be withdrawn instantly.
 *
 * A ratio of 1.0 means all assets are liquid. A ratio near 0 means
 * most assets are locked in high-utilization markets.
 *
 * Returns ratio = 1.0 for empty vaults (no withdrawal risk).
 */
export function computeLiquidityCoverage(
	vault: AccrualVault,
): LiquidityCoverageAnalysis {
	const liquidity = vault.liquidity;
	const totalAssets = vault.totalAssets;

	const ratio =
		totalAssets === 0n
			? 1
			: +formatEther(MathLib.wDivDown(liquidity, totalAssets));

	return {
		ratio: Math.min(ratio, 1),
		liquidity,
		totalAssets,
	};
}
