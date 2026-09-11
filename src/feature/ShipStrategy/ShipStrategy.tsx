"use client";

import { useState } from "react";
import { StrategyCards } from "@/components/StrategyCard";
import { TakerSwapPanel } from "@/feature/TakerSwap";
import type { RiskProfile } from "@/lib/portfolio";
import type { ShipPortfolioResult } from "@/lib/ship";
import { shipPortfolio } from "./api";
import { ShipConfirmPanel } from "./ShipConfirmPanel";
import { ShipResultDialog } from "./ShipResultDialog";
import styles from "./ShipStrategy.module.css";

export function ShipStrategy() {
	const [selectedProfile, setSelectedProfile] = useState<RiskProfile | null>(
		null,
	);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<ShipPortfolioResult | null>(null);
	const [isResultOpen, setIsResultOpen] = useState(false);
	const [isShipping, setIsShipping] = useState(false);

	const lowSleeve = result?.sleeves.find((sleeve) => sleeve.sleeve === "low");

	async function handleShip() {
		if (!selectedProfile || isShipping) return;

		setError(null);
		setIsShipping(true);

		try {
			const shipped = await shipPortfolio(selectedProfile);
			setResult(shipped);
			setIsResultOpen(true);
		} catch (shipError) {
			setError(
				shipError instanceof Error
					? shipError.message
					: "Failed to ship portfolio",
			);
		} finally {
			setIsShipping(false);
		}
	}

	return (
		<div className={styles.root}>
			<StrategyCards
				selectedProfile={selectedProfile}
				onSelect={setSelectedProfile}
				disabled={isShipping}
			/>

			{selectedProfile ? (
				<div className={styles.confirmSection}>
					<ShipConfirmPanel
						profile={selectedProfile}
						isShipping={isShipping}
						error={error}
						onShip={handleShip}
					/>
				</div>
			) : null}

			{lowSleeve ? (
				<div className={styles.confirmSection}>
					<TakerSwapPanel
						strategy={lowSleeve.strategy}
						strategyHash={lowSleeve.strategyHash}
					/>
				</div>
			) : null}

			<ShipResultDialog
				open={isResultOpen}
				result={result}
				onOpenChange={setIsResultOpen}
			/>
		</div>
	);
}
