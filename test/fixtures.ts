import {
	AccrualPosition,
	AccrualVault,
	type Address,
	Market,
	type MarketId,
	MarketParams,
	MathLib,
	VaultMarketConfig,
	VaultMarketPublicAllocatorConfig,
} from "@morpho-org/blue-sdk";

let addressCounter = 1;

/** Generate a deterministic unique address for testing. */
export function randomAddress(): Address {
	return `0x${(addressCounter++).toString(16).padStart(40, "0")}` as Address;
}

/** Reset the address counter between tests for determinism. */
export function resetAddressCounter() {
	addressCounter = 1;
}

export interface MockMarketOptions {
	loanToken?: Address;
	collateralToken?: Address;
	oracle?: Address;
	irm?: Address;
	lltv?: bigint;
	totalSupplyAssets?: bigint;
	totalBorrowAssets?: bigint;
	fee?: bigint;
	rateAtTarget?: bigint;
	lastUpdate?: bigint;
	price?: bigint;
}

export interface MockAllocationOptions {
	market: MockMarketOptions;
	/** The vault's supply shares in this market. Defaults to half of totalSupplyShares. */
	supplyShares?: bigint;
	cap?: bigint;
}

export interface MockVaultOptions {
	allocations: MockAllocationOptions[];
	fee?: bigint;
	timelock?: bigint;
	guardian?: Address;
	curator?: Address;
	owner?: Address;
	address?: Address;
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;
const DEFAULT_TIMESTAMP = BigInt(Math.floor(Date.now() / 1000));

const DEFAULT_SUPPLY = 1_000_000_000_000n;

/** Create a Market instance with sensible defaults. */
export function createMockMarket(options: MockMarketOptions = {}): Market {
	const totalSupplyAssets = options.totalSupplyAssets ?? DEFAULT_SUPPLY;
	// Default borrow to 80% of supply to keep market consistent
	const totalBorrowAssets =
		options.totalBorrowAssets ?? (totalSupplyAssets * 80n) / 100n;

	const params = new MarketParams({
		loanToken: options.loanToken ?? randomAddress(),
		collateralToken: options.collateralToken ?? randomAddress(),
		oracle: options.oracle ?? randomAddress(),
		irm: options.irm ?? randomAddress(),
		lltv: options.lltv ?? 860000000000000000n,
	});

	return new Market({
		params,
		totalSupplyAssets,
		totalBorrowAssets,
		totalSupplyShares: totalSupplyAssets * 1_000_000n,
		totalBorrowShares: totalBorrowAssets * 1_000_000n,
		rateAtTarget:
			options.rateAtTarget ?? 40000000000000000n / (365n * 24n * 3600n),
		lastUpdate: options.lastUpdate ?? DEFAULT_TIMESTAMP,
		fee: options.fee ?? 0n,
		price: options.price,
	});
}

/** Create an AccrualVault from a simplified config. */
export function createMockVault(options: MockVaultOptions): AccrualVault {
	const vaultAddress = options.address ?? randomAddress();

	const allocations = options.allocations.map((alloc) => {
		const market = createMockMarket(alloc.market);
		const totalSupplyAssets = alloc.market.totalSupplyAssets ?? DEFAULT_SUPPLY;
		// Default: vault owns half the market's supply
		const supplyShares =
			alloc.supplyShares ?? (totalSupplyAssets * 1_000_000n) / 2n;

		const config = new VaultMarketConfig({
			vault: vaultAddress,
			marketId: market.id as MarketId,
			cap: alloc.cap ?? MathLib.MAX_UINT_256,
			pendingCap: { value: 0n, validAt: 0n },
			removableAt: 0n,
			enabled: true,
			publicAllocatorConfig: new VaultMarketPublicAllocatorConfig({
				vault: vaultAddress,
				marketId: market.id as MarketId,
				maxIn: 0n,
				maxOut: 0n,
			}),
		});

		const position = new AccrualPosition(
			{
				supplyShares,
				borrowShares: 0n,
				collateral: 0n,
				user: vaultAddress,
			},
			market,
		);

		return {
			config,
			position,
		};
	});

	return new AccrualVault(
		{
			address: vaultAddress,
			owner: options.owner ?? randomAddress(),
			asset: randomAddress(),
			totalSupply: 0n,
			lastTotalAssets: 0n,
			supplyQueue: [],
			curator: options.curator ?? ZERO_ADDRESS,
			feeRecipient: randomAddress(),
			fee: options.fee ?? 0n,
			decimalsOffset: 0n,
			skimRecipient: randomAddress(),
			guardian: options.guardian ?? ZERO_ADDRESS,
			pendingGuardian: { value: ZERO_ADDRESS, validAt: 0n },
			pendingOwner: ZERO_ADDRESS,
			pendingTimelock: { value: 0n, validAt: 0n },
			lostAssets: 0n,
			timelock: options.timelock ?? 0n,
		},
		allocations,
	);
}
