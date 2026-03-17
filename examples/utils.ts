import { formatEther } from "viem";

/** Format a WAD-scaled bigint as a human-readable percentage. */
export const toPercent = (wad: bigint): string =>
	`${(Number(formatEther(wad)) * 100).toFixed(1)}%`;
