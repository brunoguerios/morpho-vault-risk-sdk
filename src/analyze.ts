import type { AccrualVault } from "@morpho-org/blue-sdk";
import {
	computeCapHeadroom,
	computeCollateralDiversity,
	computeConcentration,
	computeGovernance,
	computeLiquidityCoverage,
	computeLltvRange,
	computeOracleConcentration,
	computeUtilizationExposure,
} from "./metrics/index.js";
import type { VaultRiskAnalysis } from "./types.js";

/**
 * Runs all risk metrics on a vault and returns a complete analysis.
 *
 * This is the primary API for most users. Each metric is also available
 * individually via the `computeX` functions for selective use.
 */
export function analyzeVault(vault: AccrualVault): VaultRiskAnalysis {
	return {
		vault: vault.address,
		timestamp: Date.now(),
		concentration: computeConcentration(vault),
		liquidityCoverage: computeLiquidityCoverage(vault),
		capHeadroom: computeCapHeadroom(vault),
		utilizationExposure: computeUtilizationExposure(vault),
		lltv: computeLltvRange(vault),
		oracle: computeOracleConcentration(vault),
		collateralDiversity: computeCollateralDiversity(vault),
		governance: computeGovernance(vault),
	};
}
