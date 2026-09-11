"use client";

import { strategyById } from "@/components/StrategyCard";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { ShipPortfolioResult } from "@/lib/ship";
import styles from "./ShipStrategy.module.css";

type ShipResultDialogProps = {
	open: boolean;
	result: ShipPortfolioResult | null;
	onOpenChange: (open: boolean) => void;
};

const sleeveLabels = {
	low: "USDG / WETH",
	medium: "WETH / 1INCH",
	high: "USDG / TSLA",
} as const;

export function ShipResultDialog({
	open,
	result,
	onOpenChange,
}: ShipResultDialogProps) {
	if (!result) return null;

	const strategy = strategyById[result.profile];

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className={styles.resultDialog}>
				<DialogHeader>
					<DialogTitle>{strategy.name} portfolio shipped</DialogTitle>
					<DialogDescription>
						${result.totalUsd.toLocaleString()} was allocated across three Aqua
						strategies. Transaction hashes and decoded Aqua events are listed
						below.
					</DialogDescription>
				</DialogHeader>

				<div className={styles.resultStack}>
					{result.sleeves.map((sleeve) => (
						<article key={sleeve.txHash} className={styles.resultSleeve}>
							<header>
								<h3>{sleeveLabels[sleeve.sleeve]}</h3>
								<p>
									Tx{" "}
									<code title={sleeve.txHash}>
										{shortenHash(sleeve.txHash)}
									</code>
								</p>
							</header>
							{sleeve.strategyHash ? (
								<p>
									Strategy hash{" "}
									<code title={sleeve.strategyHash}>
										{shortenHash(sleeve.strategyHash)}
									</code>
								</p>
							) : null}
							<ul>
								{sleeve.events.map((event) => (
									<li
										key={
											event.type === "Pushed"
												? `${sleeve.txHash}-pushed-${event.token}-${event.amount}`
												: `${sleeve.txHash}-shipped-${event.strategyHash}`
										}
									>
										{event.message}
									</li>
								))}
							</ul>
						</article>
					))}
				</div>

				<DialogFooter>
					<Button type="button" onClick={() => onOpenChange(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

function shortenHash(hash: string) {
	return `${hash.slice(0, 10)}…${hash.slice(-8)}`;
}
