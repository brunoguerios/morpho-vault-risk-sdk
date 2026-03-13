import { type AccrualVault, type Address, MathLib } from "@morpho-org/blue-sdk";
import { formatEther } from "viem";
import type { OracleAnalysis } from "../types.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Computes oracle diversity across the vault's market allocations.
 *
 * Groups markets by oracle address and computes each oracle's proportion
 * of the vault's total assets. Flags if a single oracle dominates above
 * the given threshold.
 *
 * Idle markets (oracle === zeroAddress) are excluded.
 *
 * @param dominanceThreshold - Proportion threshold for dominance flag (default 0.5)
 */
export function computeOracleConcentration(
	vault: AccrualVault,
	dominanceThreshold = 0.5,
): OracleAnalysis {
	const oracleMap = new Map<Address, bigint>();
	const totalAssets = vault.totalAssets;

	for (const [, allocation] of vault.allocations) {
		const oracle = allocation.position.market.params.oracle;
		if (oracle === ZERO_ADDRESS) continue;

		const current = oracleMap.get(oracle) ?? 0n;
		oracleMap.set(oracle, current + allocation.position.supplyAssets);
	}

	const oracles = [...oracleMap.keys()];
	const exposure = [...oracleMap.entries()]
		.map(([oracle, assets]) => ({
			oracle,
			proportion:
				totalAssets > 0n
					? +formatEther(MathLib.wDivDown(assets, totalAssets))
					: 0,
		}))
		.sort((a, b) => b.proportion - a.proportion);

	const isSingleOracleDominant = exposure.some(
		(e) => e.proportion > dominanceThreshold,
	);

	return {
		distinctCount: oracles.length,
		oracles,
		exposure,
		isSingleOracleDominant,
	};
}
