import type { AccrualVault } from "@morpho-org/blue-sdk";
import { formatEther } from "viem";
import { analyzeVault } from "./analyze.js";
import type {
	RankingEntry,
	VaultComparison,
	VaultRiskAnalysis,
} from "./types.js";

/**
 * Rank vaults by a numeric extractor. Lower value = better rank (rank 1).
 * For metrics where higher is worse (e.g., squaredProportionsSum), pass the value directly.
 * For metrics where higher is better (e.g., liquidity), pass the negated value.
 *
 * Values are rounded to `precision` decimal places before comparison,
 * so that ranks stay consistent with displayed values.
 */
function rank(
	analyses: VaultRiskAnalysis[],
	extractor: (a: VaultRiskAnalysis) => number,
	precision = 4,
): ReadonlyArray<RankingEntry> {
	const round = (v: number) => Math.round(v * 10 ** precision) / 10 ** precision;
	const sorted = [...analyses].sort(
		(a, b) => round(extractor(a)) - round(extractor(b)),
	);
	let currentRank = 1;
	return sorted.map((a, i) => {
		if (i > 0 && round(extractor(sorted[i - 1]!)) !== round(extractor(a))) {
			currentRank = i + 1;
		}
		return { vault: a.vault, rank: currentRank };
	});
}

/**
 * Analyzes and compares multiple vaults side by side.
 *
 * Returns per-metric rankings where rank 1 = best (least risky).
 * Rankings are objective — no subjective weighting is applied.
 *
 * Ranking logic per metric:
 * - concentration: lower squaredProportionsSum = better (more diversified)
 * - liquidityCoverage: higher ratio = better (more liquid)
 * - lltv: lower weighted avg = better (more conservative)
 * - oracleDiversity: more distinct oracles = better
 * - governance: longer timelock = better
 */
export function compareVaults(vaults: AccrualVault[]): VaultComparison {
	const analyses = vaults.map(analyzeVault);

	return {
		vaults: analyses,
		rankings: {
			// Lower squaredProportionsSum = more diversified = better
			concentration: rank(analyses, (a) => a.concentration.squaredProportionsSum),
			// Higher liquidity ratio = better (negate for ascending sort)
			liquidityCoverage: rank(analyses, (a) => -a.liquidityCoverage.ratio),
			// Lower weighted avg LLTV = more conservative = better
			lltv: rank(analyses, (a) => +formatEther(a.lltv.weightedAvg)),
			// More distinct oracles = better (negate)
			oracleDiversity: rank(analyses, (a) => -a.oracle.distinctCount),
			// Longer timelock = better (negate)
			governance: rank(analyses, (a) => -Number(a.governance.timelockSeconds)),
		},
	};
}
