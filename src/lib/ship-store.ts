import type { ShipPortfolioResult } from "./ship";

const STORAGE_KEY = "aqua-last-ship";

export function saveShippedPortfolio(result: ShipPortfolioResult) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
}

export function loadShippedPortfolio(): ShipPortfolioResult | null {
	if (typeof window === "undefined") return null;

	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;

	try {
		return JSON.parse(raw) as ShipPortfolioResult;
	} catch {
		return null;
	}
}
