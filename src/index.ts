// Types
export type {
	ConcentrationAnalysis,
	LiquidityCoverageAnalysis,
	MarketCapHeadroom,
	CapHeadroomAnalysis,
	UtilizationExposureAnalysis,
	LltvAnalysis,
	OracleAnalysis,
	CollateralDiversityAnalysis,
	GovernanceAnalysis,
	TimelockTier,
	VaultRiskAnalysis,
	RankingEntry,
	VaultComparison,
} from "./types.js";

// Errors
export {
	EmptyVaultError,
	ZeroTotalAssetsError,
	NoActiveMarketsError,
} from "./errors.js";

// Individual metrics
export { computeConcentration } from "./metrics/concentration.js";
export { computeLiquidityCoverage } from "./metrics/liquidity.js";
export { computeCapHeadroom } from "./metrics/cap-headroom.js";
export { computeUtilizationExposure } from "./metrics/utilization.js";
export { computeLltvRange } from "./metrics/lltv.js";
export { computeOracleConcentration } from "./metrics/oracle.js";
export { computeCollateralDiversity } from "./metrics/collateral.js";
export { computeGovernance } from "./metrics/governance.js";

// Orchestrators
export { analyzeVault } from "./analyze.js";
export { compareVaults } from "./compare.js";

// Fetch layer (requires viem + @morpho-org/blue-sdk-viem)
export { fetchAndAnalyzeVault, fetchAndCompareVaults } from "./fetch.js";
