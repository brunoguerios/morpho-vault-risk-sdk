import type { AccrualVault } from "@morpho-org/blue-sdk";
import type { GovernanceAnalysis, TimelockTier } from "../types.js";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ONE_DAY = 86400n;
const SEVEN_DAYS = 604800n;

function getTimelockTier(seconds: bigint): TimelockTier {
	if (seconds === 0n) return "none";
	if (seconds < ONE_DAY) return "short";
	if (seconds < SEVEN_DAYS) return "medium";
	return "long";
}

/**
 * Assesses the vault's governance configuration.
 *
 * Evaluates timelock duration (categorized into tiers), whether guardian
 * and curator roles are set, and the performance fee.
 *
 * Longer timelocks give depositors more time to react to governance changes.
 */
export function computeGovernance(vault: AccrualVault): GovernanceAnalysis {
	return {
		timelockSeconds: vault.timelock,
		timelockTier: getTimelockTier(vault.timelock),
		hasGuardian: vault.guardian !== ZERO_ADDRESS,
		hasCurator: vault.curator !== ZERO_ADDRESS,
		fee: vault.fee,
	};
}
