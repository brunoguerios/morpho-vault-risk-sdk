/**
 * Live vault comparison example.
 *
 * Fetches on-chain data for well-known Morpho vaults on Ethereum mainnet
 * and compares their risk profiles side by side.
 *
 * Prerequisites:
 *   - `@morpho-org/blue-sdk-viem` installed (optional dependency)
 *
 * Usage:
 *   npx tsx --env-file=.env examples/live-comparison.ts
 */
import { type Address } from "@morpho-org/blue-sdk";
import { createPublicClient, http } from "viem";
import { mainnet } from "viem/chains";
import { fetchAndCompareVaults } from "../src/index.js";
import { toPercent } from "./utils.js";

// Top Morpho vaults by deposits (as of early 2026).
// In production you'd discover these dynamically via the Morpho GraphQL API.
const VAULTS: { name: string; address: Address }[] = [
	{
		name: "Steakhouse USDC",
		address: "0xBEEF01735c132Ada46AA9aA4c54623cAA92A64CB",
	},
	{
		name: "Gauntlet USDC Prime",
		address: "0xdd0f28e19C1780eb6396170735D45153D261490d",
	}
];

if (process.env.ETH_RPC_URL !== undefined) {
	console.log(`Using custom RPC URL: ${process.env.ETH_RPC_URL}`);
}

// Falls back to viem's default public RPC if ETH_RPC_URL is not set.
const client = createPublicClient({
	chain: mainnet,
	transport: http(process.env.ETH_RPC_URL),
});

const addresses = VAULTS.map((v) => v.address);
const labels = new Map(VAULTS.map((v) => [v.address, v.name]));

console.log("Fetching on-chain data for:");
for (const v of VAULTS) {
	console.log(`  ${v.name} (${v.address})`);
}
console.log();

const result = await fetchAndCompareVaults(addresses, client);

// Print each vault's key metrics
for (const analysis of result.vaults) {
	const name = labels.get(analysis.vault) ?? analysis.vault;
	console.log(`=== ${name} ===`);
	console.log(`  Concentration: ${analysis.concentration.squaredProportionsSum.toFixed(3)} (${analysis.concentration.activeMarketCount} markets)`);
	console.log(`  Liquidity ratio: ${(analysis.liquidityCoverage.ratio * 100).toFixed(1)}%`);
	console.log(`  Utilization (weighted): ${(analysis.utilizationExposure.weightedAvg * 100).toFixed(1)}%`);
	console.log(`  LLTV weighted average: ${toPercent(analysis.lltv.weightedAvg)}`);
	console.log(`  Oracle diversity: ${analysis.oracle.distinctCount} oracle(s), dominant=${analysis.oracle.isSingleOracleDominant}`);
	console.log(`  Governance: timelock=${analysis.governance.timelockTier}, guardian=${analysis.governance.hasGuardian}`);
	console.log();
}

// Print rankings
console.log("=== Rankings (1 = best) ===\n");
for (const [metric, rankings] of Object.entries(result.rankings)) {
	console.log(`${metric}:`);
	for (const entry of rankings) {
		const name = labels.get(entry.vault) ?? entry.vault;
		console.log(`  #${entry.rank} ${name}`);
	}
}
