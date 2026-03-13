import { fetchAccrualVault } from "@morpho-org/blue-sdk-viem";
import type { Address, Client } from "viem";
import { analyzeVault } from "./analyze.js";
import { compareVaults } from "./compare.js";
import type { VaultComparison, VaultRiskAnalysis } from "./types.js";

/**
 * Fetches vault data from on-chain and runs the full risk analysis.
 *
 * Requires `@morpho-org/blue-sdk-viem` as an installed dependency.
 * This is the convenience entry point for users who want to go
 * from an address directly to a risk analysis.
 */
export async function fetchAndAnalyzeVault(
	address: Address,
	client: Client,
): Promise<VaultRiskAnalysis> {
	const vault = await fetchAccrualVault(address, client);
	return analyzeVault(vault);
}

/**
 * Fetches multiple vaults and compares their risk profiles.
 *
 * Vaults are fetched in parallel for efficiency.
 */
export async function fetchAndCompareVaults(
	addresses: Address[],
	client: Client,
): Promise<VaultComparison> {
	const vaults = await Promise.all(
		addresses.map((address) => fetchAccrualVault(address, client)),
	);
	return compareVaults(vaults);
}
