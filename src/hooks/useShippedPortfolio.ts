"use client";

import { useCallback, useEffect, useState } from "react";
import { loadShippedPortfolio } from "@/lib/ship-store";
import type { ShipPortfolioResult } from "@/lib/ship";

export function useShippedPortfolio() {
	const [result, setResult] = useState<ShipPortfolioResult | null>(null);
	const [isReady, setIsReady] = useState(false);

	const refresh = useCallback(() => {
		setResult(loadShippedPortfolio());
	}, []);

	useEffect(() => {
		refresh();
		setIsReady(true);
	}, [refresh]);

	return { result, isReady, refresh, setResult };
}
