import type { Address } from "@morpho-org/blue-sdk";

export class EmptyVaultError extends Error {
	constructor(public readonly vault: Address) {
		super(`vault "${vault}" has no allocations`);
	}
}

export class ZeroTotalAssetsError extends Error {
	constructor(public readonly vault: Address) {
		super(`vault "${vault}" has zero total assets`);
	}
}

export class NoActiveMarketsError extends Error {
	constructor(public readonly vault: Address) {
		super(`vault "${vault}" has no markets with non-zero allocation`);
	}
}
