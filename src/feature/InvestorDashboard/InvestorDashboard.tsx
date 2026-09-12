"use client";

import Link from "next/link";
import { formatUnits } from "viem";
import { strategyById } from "@/components/StrategyCard";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useShippedPortfolio } from "@/hooks/useShippedPortfolio";
import {
	buildPortfolioAllocations,
	FIXED_TOKEN_PRICES_USD,
	PROFILE_WEIGHTS,
	SLEEVE_LABELS,
} from "@/lib/portfolio";
import { getTokenDecimals } from "@/lib/tokens";
import { shortenAddress } from "@/lib/wallet";
import styles from "./InvestorDashboard.module.css";

export function InvestorDashboard() {
	const { result, isReady } = useShippedPortfolio();

	if (!isReady) return null;

	if (!result) {
		return (
			<Card className={styles.empty}>
				<CardHeader>
					<CardTitle>No positions yet</CardTitle>
					<CardDescription>
						Deploy a strategy on Home. Your sleeve amounts will show up here.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild className={styles.cta}>
						<Link href="/">Choose a strategy</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const strategy = strategyById[result.profile];
	const { allocations } = buildPortfolioAllocations({
		totalUsd: result.totalUsd,
		weights: PROFILE_WEIGHTS[result.profile],
		prices: FIXED_TOKEN_PRICES_USD,
	});

	return (
		<div className={styles.root}>
			<Card className={styles.summary}>
				<CardHeader>
					<CardTitle>{strategy.name} portfolio</CardTitle>
					<CardDescription>
						${result.totalUsd.toLocaleString()} allocated across three Aqua
						strategies.
					</CardDescription>
				</CardHeader>
			</Card>

			<div className={styles.grid}>
				{allocations.map((allocation) => {
					const sleeve = result.sleeves.find(
						(item) => item.sleeve === allocation.sleeve,
					);
					const percent = Math.round(
						PROFILE_WEIGHTS[result.profile][allocation.sleeve] * 100,
					);

					return (
						<Card key={allocation.sleeve} className={styles.position}>
							<CardHeader>
								<CardTitle>{SLEEVE_LABELS[allocation.sleeve]}</CardTitle>
								<CardDescription>
									{percent}% · ${allocation.usdValue.toFixed(0)}
								</CardDescription>
							</CardHeader>
							<CardContent className={styles.amounts}>
								{allocation.legs.map((leg) => (
									<p key={leg.token.symbol}>
										<span>{formatTokenSymbol(leg.token.symbol)}</span>
										<strong>
											{formatAmount(leg.amount, leg.token.symbol)}
										</strong>
									</p>
								))}
								{sleeve?.strategyHash ? (
									<p className={styles.hash}>
										Hash{" "}
										<code title={sleeve.strategyHash}>
											{shortenAddress(sleeve.strategyHash)}
										</code>
									</p>
								) : null}
							</CardContent>
						</Card>
					);
				})}
			</div>
		</div>
	);
}

function formatTokenSymbol(symbol: string) {
	return symbol === "ONEINCH" ? "1INCH" : symbol;
}

function formatAmount(amount: bigint, symbol: string) {
	const value = Number(formatUnits(amount, getTokenDecimals(symbol)));
	return value.toLocaleString(undefined, { maximumFractionDigits: 6 });
}
