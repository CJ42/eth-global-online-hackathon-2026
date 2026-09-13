"use client";

import { useCallback, useEffect, useState } from "react";
import type { Address } from "viem";
import type { ShipPortfolioResult } from "@/lib/ship";
import { loadShippedPortfolio } from "@/lib/ship-store";

export function useShippedPortfolio(maker?: Address | null) {
	const [result, setResult] = useState<ShipPortfolioResult | null>(null);
	const [isReady, setIsReady] = useState(false);

	const refresh = useCallback(() => {
		setResult(loadShippedPortfolio(maker));
	}, [maker]);

	useEffect(() => {
		refresh();
		setIsReady(true);
	}, [refresh]);

	return { result, isReady, refresh, setResult };
}
