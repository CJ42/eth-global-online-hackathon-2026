"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import type { RiskProfile } from "@/lib/portfolio";
import { PROFILE_WEIGHTS } from "@/lib/portfolio";
import { FIXED_SHIP_TOTAL_USD } from "@/lib/ship";
import styles from "./ShipStrategy.module.css";

type ShipConfirmPanelProps = {
	profile: RiskProfile;
	isShipping: boolean;
	error: string | null;
	onShip: () => void;
};

const liquidityPairs = [
	{ sleeve: "low", label: "USDG / WETH" },
	{ sleeve: "medium", label: "WETH / 1INCH" },
	{ sleeve: "high", label: "USDG / TSLA" },
] as const;

export function ShipConfirmPanel({
	profile,
	isShipping,
	error,
	onShip,
}: ShipConfirmPanelProps) {
	const weights = PROFILE_WEIGHTS[profile];

	return (
		<Card className={styles.confirmCard}>
			<CardHeader>
				<CardTitle className="text-2xl">Portfolio Overview</CardTitle>
				<CardTitle>Confirm funds allocation</CardTitle>
				<CardDescription>
					Ship a fixed ${FIXED_SHIP_TOTAL_USD.toLocaleString()} allocation
					across three Aqua strategies on the local Robinhood fork.
				</CardDescription>
			</CardHeader>
			<CardContent className={styles.confirmContent}>
				<table className={styles.summaryTable}>
					<thead>
						<tr>
							<th scope="col">Liquidity Pair</th>
							<th scope="col">% Allocated</th>
							<th scope="col">USD Value</th>
						</tr>
					</thead>
					<tbody>
						{liquidityPairs.map((pair) => {
							const percent = Math.round(weights[pair.sleeve] * 100);
							const usdValue = FIXED_SHIP_TOTAL_USD * weights[pair.sleeve];

							return (
								<tr key={pair.sleeve}>
									<td>{pair.label}</td>
									<td>{percent}%</td>
									<td>${usdValue.toFixed(0)}</td>
								</tr>
							);
						})}
					</tbody>
				</table>

				{isShipping ? (
					<p className={styles.progress} aria-live="polite">
						Approving tokens and shipping three Aqua strategies…
					</p>
				) : null}

				{error ? (
					<p className={styles.error} role="alert">
						{error}
					</p>
				) : null}
			</CardContent>
			<CardFooter>
				<Button
					type="button"
					size="lg"
					className={styles.shipButton}
					disabled={isShipping}
					onClick={onShip}
				>
					{isShipping ? "Deploying…" : "Deploy strategies"}
				</Button>
			</CardFooter>
		</Card>
	);
}
