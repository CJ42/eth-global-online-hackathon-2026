import type { Address } from "viem";
import type { ShipPortfolioResult } from "./ship";

const LEGACY_STORAGE_KEY = "aqua-last-ship";

function storageKey(maker: Address) {
	return `${LEGACY_STORAGE_KEY}:${maker.toLowerCase()}`;
}

export function saveShippedPortfolio(result: ShipPortfolioResult) {
	const raw = JSON.stringify(result);
	localStorage.setItem(storageKey(result.maker), raw);
	// Traders still read the latest ship regardless of who is connected.
	localStorage.setItem(LEGACY_STORAGE_KEY, raw);
}

export function loadShippedPortfolio(
	maker?: Address | null,
): ShipPortfolioResult | null {
	if (typeof window === "undefined") return null;

	const raw = maker
		? localStorage.getItem(storageKey(maker))
		: localStorage.getItem(LEGACY_STORAGE_KEY);
	if (!raw) return null;

	try {
		return JSON.parse(raw) as ShipPortfolioResult;
	} catch {
		return null;
	}
}
