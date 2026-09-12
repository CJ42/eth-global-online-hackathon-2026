"use client";

import { useEffect, useState } from "react";
import { loadShippedPortfolio } from "@/lib/ship-store";
import type { ShipPortfolioResult } from "@/lib/ship";

export function useShippedPortfolio() {
	const [result, setResult] = useState<ShipPortfolioResult | null>(null);
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		setResult(loadShippedPortfolio());
		setIsReady(true);
	}, []);

	return { result, isReady };
}
