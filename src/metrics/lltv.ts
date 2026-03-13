import { type AccrualVault, MathLib } from "@morpho-org/blue-sdk";
import { NoActiveMarketsError } from "../errors.js";
import type { LltvAnalysis } from "../types.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Computes the LLTV (Liquidation Loan-to-Value) range across the vault's markets.
 *
 * Idle markets (collateralToken === zeroAddress) are excluded since they have no
 * meaningful LLTV.
 *
 * @throws {NoActiveMarketsError} if no non-idle markets exist.
 */
export function computeLltvRange(vault: AccrualVault): LltvAnalysis {
	let min = MathLib.MAX_UINT_256;
	let max = 0n;
	let weightedSum = 0n;
	let totalWeight = 0n;
	const distinctSet = new Set<bigint>();

	for (const [, allocation] of vault.allocations) {
		const params = allocation.position.market.params;

		// Skip idle markets (no collateral)
		if (params.collateralToken === ZERO_ADDRESS) continue;

		const lltv = params.lltv;
		const supplyAssets = allocation.position.supplyAssets;

		distinctSet.add(lltv);

		if (lltv < min) min = lltv;
		if (lltv > max) max = lltv;

		weightedSum += MathLib.wMulDown(lltv, supplyAssets);
		totalWeight += supplyAssets;
	}

	if (distinctSet.size === 0) {
		throw new NoActiveMarketsError(vault.address);
	}

	const weightedAvg =
		totalWeight > 0n ? MathLib.wDivDown(weightedSum, totalWeight) : 0n;
	const distinctValues = [...distinctSet].sort((a, b) =>
		a < b ? -1 : a > b ? 1 : 0,
	);

	return { min, max, weightedAvg, distinctValues };
}
