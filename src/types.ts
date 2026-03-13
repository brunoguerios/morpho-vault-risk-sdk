import type { Address, MarketId } from "@morpho-org/blue-sdk";

/** HHI ranges from 0 (perfectly diversified) to 1 (single market). */
export interface ConcentrationAnalysis {
	/** Herfindahl-Hirschman Index, 0-1 range */
	hhi: number;
	/** Number of markets with non-zero allocation */
	activeMarketCount: number;
	/** Equivalent number of equally-weighted markets (1/HHI) */
	effectiveMarketCount: number;
	/** Per-market proportion breakdown, sorted descending */
	marketProportions: ReadonlyArray<{
		marketId: MarketId;
		proportion: number;
	}>;
}

/** What fraction of vault assets can be withdrawn instantly. */
export interface LiquidityCoverageAnalysis {
	/** vault.liquidity / vault.totalAssets, 0-1 range */
	ratio: number;
	/** Raw liquidity in asset units */
	liquidity: bigint;
	/** Raw total assets */
	totalAssets: bigint;
}

/** Per-market distance to allocation cap. */
export interface MarketCapHeadroom {
	marketId: MarketId;
	/** supplyAssets / cap (WAD-scaled) */
	utilization: bigint;
	/** cap - supplyAssets, raw asset units */
	remainingCapacity: bigint;
	/** cap === 0n (unlimited allocation) */
	isUnlimited: boolean;
}

export interface CapHeadroomAnalysis {
	/** Per-market breakdown */
	markets: ReadonlyArray<MarketCapHeadroom>;
	/** Market closest to its cap (highest utilization, excluding unlimited) */
	tightest: MarketCapHeadroom | null;
	/** Weighted average cap utilization across capped markets, 0-1 */
	weightedAvgUtilization: number;
}

/** Weighted-average borrow utilization across vault's market allocations. */
export interface UtilizationExposureAnalysis {
	/** Weighted average market utilization, 0-1 */
	weightedAvg: number;
	/** Per-market utilization (borrow/supply on the market itself) */
	perMarket: ReadonlyArray<{
		marketId: MarketId;
		/** Market borrow utilization, 0-1 */
		utilization: number;
		/** Proportion of vault assets in this market, 0-1 */
		weight: number;
	}>;
	/** Highest single-market utilization */
	max: number;
}

/** LLTV distribution across allocated markets. */
export interface LltvAnalysis {
	/** Minimum LLTV across allocated markets (WAD-scaled) */
	min: bigint;
	/** Maximum LLTV across allocated markets (WAD-scaled) */
	max: bigint;
	/** Weighted average LLTV (WAD-scaled) */
	weightedAvg: bigint;
	/** Distinct LLTV values used */
	distinctValues: ReadonlyArray<bigint>;
}

/** Oracle diversity across vault markets. */
export interface OracleAnalysis {
	/** Number of distinct oracle addresses */
	distinctCount: number;
	/** Set of oracle addresses */
	oracles: ReadonlyArray<Address>;
	/** Per-oracle proportion of vault assets exposed */
	exposure: ReadonlyArray<{
		oracle: Address;
		proportion: number;
	}>;
	/** True if a single oracle accounts for > threshold */
	isSingleOracleDominant: boolean;
}

/** Collateral token diversity. */
export interface CollateralDiversityAnalysis {
	/** Number of distinct collateral tokens */
	distinctCount: number;
	/** Per-collateral breakdown */
	collaterals: ReadonlyArray<{
		address: Address;
		proportion: number;
		marketCount: number;
		lltvs: ReadonlyArray<bigint>;
	}>;
	/** HHI over collateral proportions, 0-1 */
	hhi: number;
}

export type TimelockTier = "none" | "short" | "medium" | "long";

/** Governance / timelock assessment. */
export interface GovernanceAnalysis {
	/** Timelock duration in seconds */
	timelockSeconds: bigint;
	/** Human-readable timelock category */
	timelockTier: TimelockTier;
	/** Whether guardian is set (non-zero address) */
	hasGuardian: boolean;
	/** Whether curator is set (non-zero address) */
	hasCurator: boolean;
	/** Vault performance fee (WAD-scaled) */
	fee: bigint;
}

/** Full risk analysis for a single vault. */
export interface VaultRiskAnalysis {
	/** Vault address */
	vault: Address;
	/** Timestamp of analysis (ms since epoch) */
	timestamp: number;
	concentration: ConcentrationAnalysis;
	liquidityCoverage: LiquidityCoverageAnalysis;
	capHeadroom: CapHeadroomAnalysis;
	utilizationExposure: UtilizationExposureAnalysis;
	lltv: LltvAnalysis;
	oracle: OracleAnalysis;
	collateralDiversity: CollateralDiversityAnalysis;
	governance: GovernanceAnalysis;
}

/** Per-metric ranking entry. */
export interface RankingEntry {
	vault: Address;
	rank: number;
}

/** Comparison of multiple vaults with per-metric rankings. */
export interface VaultComparison {
	vaults: ReadonlyArray<VaultRiskAnalysis>;
	rankings: {
		concentration: ReadonlyArray<RankingEntry>;
		liquidityCoverage: ReadonlyArray<RankingEntry>;
		lltv: ReadonlyArray<RankingEntry>;
		oracleDiversity: ReadonlyArray<RankingEntry>;
		governance: ReadonlyArray<RankingEntry>;
	};
}
