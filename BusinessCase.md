# Business Case: Morpho Vault Risk SDK

## The problem

Morpho vaults (MetaMorpho) are permissionlessly created — anyone can deploy one. This is a core strength of the protocol, but it creates a trust and evaluation gap. Today, the Morpho SDK ecosystem provides excellent tools to **interact** with vaults (fetch data, simulate positions, execute transactions) but nothing to **evaluate** them programmatically.

Depositors, curators, and integrators currently rely on manual inspection or proprietary dashboards to assess vault risk. There is no shared, reusable vocabulary for vault risk metrics — each team reinvents the same calculations, often inconsistently.

## What this SDK does

`@morpho-org/vault-risk-sdk` computes 8 objective, quantifiable risk metrics from on-chain vault data:

- **Concentration** — how diversified is the vault across markets? (HHI)
- **Liquidity coverage** — what fraction of assets can be withdrawn instantly?
- **Cap headroom** — how close are markets to their allocation caps?
- **Utilization exposure** — how much of supplied assets are being borrowed?
- **LLTV range** — what liquidation thresholds is the vault exposed to?
- **Oracle diversity** — is the vault dependent on a single price oracle?
- **Collateral diversity** — how many distinct collateral tokens back the vault?
- **Governance** — what timelock, guardian, and curator protections exist?

It also provides a comparison function that ranks multiple vaults per metric, giving integrators a way to programmatically surface the "safer" vault without imposing subjective scoring.

## Why it's valuable to Morpho

1. **Reduces friction for integrators.** Any protocol, aggregator, or wallet integrating Morpho vaults can use this SDK to surface risk information without building their own analysis layer. Lower integration cost = more integrations.

2. **Standardizes risk vocabulary.** By providing canonical metric definitions (HHI for concentration, WAD-scaled LLTV ranges, timelock tiers), the SDK creates a shared language for discussing vault risk across the ecosystem.

3. **Builds on existing Morpho SDK primitives.** The SDK takes `AccrualVault` as input — the same type that `@morpho-org/blue-sdk-viem` already fetches. It doesn't duplicate data fetching or introduce new on-chain calls. It's a pure computation layer on top of data Morpho already provides.

4. **Composable by design.** Each metric is an independent pure function. Consumers can use `analyzeVault()` for the full picture, or import individual metrics for specific use cases (monitoring alerts, curator dashboards, risk scoring models).

## How I'd improve it with more time

- **Historical tracking** — store snapshots over time to detect trends (concentration increasing, liquidity decreasing) and surface rate-of-change alerts.
- **Vault discovery** — integrate with Morpho's GraphQL API to find top vaults by TVL, enabling fully automated comparison workflows.
- **Risk-adjusted return analysis** — `AccrualVault` already exposes `apy`/`netApy`. By plotting each vault's yield against its risk metrics, the SDK could flag outliers where return looks unusually high for the risk profile — a Sharpe-ratio-inspired approach. This isn't about judging what's "safe," but surfacing asymmetries that curators and integrators would want to investigate (e.g., two vaults with similar concentration and LLTV, but one pays 2x the APY — why?).
- **Composite risk scoring** — provide an opinionated but configurable scoring framework on top of the raw metrics, with pluggable weight profiles for different use cases (conservative depositor vs. yield-maximizing integrator).
- **Market correlation analysis** — detect when multiple markets share correlated collateral (e.g., stETH and wstETH) that wouldn't be visible from simple token-address diversity.
- **CI/CD integration** — a CLI tool that curators can run in CI to gate vault configuration changes on risk metric thresholds.
