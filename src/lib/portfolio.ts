import { TOKENIZED_STOCKS, TOKENS } from "@/constants";
import { tokenAmountToUsd, usdToTokenAmount } from "./tokens";

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type SleeveId = "low" | "medium" | "high";

export const SLEEVE_LABELS = {
	low: "USDG / WETH",
	medium: "WETH / 1INCH",
	high: "USDG / TSLA",
} as const satisfies Record<SleeveId, string>;

export const TOKEN_META = {
	USDG: { symbol: "USDG", address: TOKENS.USDG },
	WETH: { symbol: "WETH", address: TOKENS.WETH },
	ONEINCH: { symbol: "ONEINCH", address: TOKENS.ONEINCH },
	TSLA: { symbol: "TSLA", address: TOKENIZED_STOCKS.TSLA },
} as const;

export type TokenMeta = (typeof TOKEN_META)[keyof typeof TOKEN_META];

export interface SleeveWeights {
	low: number;
	medium: number;
	high: number;
}

export interface TokenPricesUsd {
	USDG: number;
	WETH: number;
	ONEINCH: number;
	TSLA: number;
}

export interface LiquidityLeg {
	token: TokenMeta;
	amount: bigint;
	usdValue: number;
}

export type PairAllocation = {
	sleeve: SleeveId;
	usdValue: number;
	legs: [LiquidityLeg, LiquidityLeg];
};

export interface BuildPortfolioAllocationsInput {
	totalUsd: number;
	weights: SleeveWeights;
	prices: TokenPricesUsd;
}

export interface BuildPortfolioAllocationsResult {
	allocations: [PairAllocation, PairAllocation, PairAllocation];
}

export const PROFILE_WEIGHTS = {
	conservative: { low: 0.5, medium: 0.3, high: 0.2 },
	balanced: { low: 0.25, medium: 0.5, high: 0.25 },
	aggressive: { low: 0.2, medium: 0.3, high: 0.5 },
} as const satisfies Record<RiskProfile, SleeveWeights>;

export const FIXED_TOKEN_PRICES_USD = {
	USDG: 1,
	WETH: 2500,
	ONEINCH: 0.1,
	TSLA: 350,
} as const satisfies TokenPricesUsd

export const DRIFTED_TOKEN_PRICES_USD = {
	USDG: 1,
	WETH: 2500,
	ONEINCH: 0.1,
	TSLA: 1225,
} as const satisfies TokenPricesUsd

export const REBALANCE_BAND = 0.05

export interface SleeveDrift {
	sleeve: SleeveId
	currentUsd: number
	currentShare: number
	targetShare: number
	drift: number
	isOutsideBand: boolean
}

export interface PortfolioDriftResult {
	totalCurrentUsd: number
	sleeves: Record<SleeveId, SleeveDrift>
	maxDrift: number
	needsRebalance: boolean
}

export interface ComputeSleeveDriftInput {
	allocations: PairAllocation[]
	prices: TokenPricesUsd
	weights: SleeveWeights
}

export function computeSleeveDrift({
	allocations,
	prices,
	weights,
}: ComputeSleeveDriftInput): PortfolioDriftResult {
	const sleeveValues = allocations.map((allocation) => {
		const currentUsd = allocation.legs.reduce((sum, leg) => {
			const price = prices[leg.token.symbol as keyof TokenPricesUsd] ?? 0
			return (
				sum +
				tokenAmountToUsd({
					amount: leg.amount,
					priceUsd: price,
					symbol: leg.token.symbol,
				})
			)
		}, 0)

		return {
			sleeve: allocation.sleeve,
			currentUsd,
		}
	})

	const totalCurrentUsd = sleeveValues.reduce(
		(sum, item) => sum + item.currentUsd,
		0,
	)

	const sleeves = {} as Record<SleeveId, SleeveDrift>
	let maxDrift = 0
	let needsRebalance = false

	for (const { sleeve, currentUsd } of sleeveValues) {
		const targetShare = weights[sleeve]
		const currentShare = totalCurrentUsd > 0 ? currentUsd / totalCurrentUsd : 0
		const drift = currentShare - targetShare
		const absDrift = Math.abs(drift)
		const isOutsideBand = absDrift > REBALANCE_BAND

		if (absDrift > maxDrift) maxDrift = absDrift
		if (isOutsideBand) needsRebalance = true

		sleeves[sleeve] = {
			sleeve,
			currentUsd,
			currentShare,
			targetShare,
			drift,
			isOutsideBand,
		}
	}

	return {
		totalCurrentUsd,
		sleeves,
		maxDrift,
		needsRebalance,
	}
}

const WEIGHT_TOLERANCE = 1e-9;

export function buildPortfolioAllocations({
	totalUsd,
	weights,
	prices,
}: BuildPortfolioAllocationsInput): BuildPortfolioAllocationsResult {
	if (!(totalUsd > 0)) throw new Error("totalUsd must be greater than 0");

	assertValidWeights(weights);
	assertValidPrices(prices);

	const lowUsd = totalUsd * weights.low;
	const mediumUsd = totalUsd * weights.medium;
	const highUsd = totalUsd * weights.high;

	const allocations: [PairAllocation, PairAllocation, PairAllocation] = [
		buildPairAllocation({
			sleeve: "low",
			usdValue: lowUsd,
			tokenA: TOKEN_META.USDG,
			tokenB: TOKEN_META.WETH,
			priceA: prices.USDG,
			priceB: prices.WETH,
		}),
		buildPairAllocation({
			sleeve: "medium",
			usdValue: mediumUsd,
			tokenA: TOKEN_META.WETH,
			tokenB: TOKEN_META.ONEINCH,
			priceA: prices.WETH,
			priceB: prices.ONEINCH,
		}),
		buildPairAllocation({
			sleeve: "high",
			usdValue: highUsd,
			tokenA: TOKEN_META.USDG,
			tokenB: TOKEN_META.TSLA,
			priceA: prices.USDG,
			priceB: prices.TSLA,
		}),
	];

	return {
		allocations,
	};
}

function buildPairAllocation({
	sleeve,
	usdValue,
	tokenA,
	tokenB,
	priceA,
	priceB,
}: {
	sleeve: SleeveId;
	usdValue: number;
	tokenA: TokenMeta;
	tokenB: TokenMeta;
	priceA: number;
	priceB: number;
}): PairAllocation {
	const halfUsd = usdValue / 2;

	return {
		sleeve,
		usdValue,
		legs: [
			{
				token: tokenA,
				usdValue: halfUsd,
				amount: usdToTokenAmount({
					usd: halfUsd,
					priceUsd: priceA,
					symbol: tokenA.symbol,
				}),
			},
			{
				token: tokenB,
				usdValue: halfUsd,
				amount: usdToTokenAmount({
					usd: halfUsd,
					priceUsd: priceB,
					symbol: tokenB.symbol,
				}),
			},
		],
	};
}

function assertValidWeights(weights: SleeveWeights) {
	const { low, medium, high } = weights;
	if (!(low >= 0 && medium >= 0 && high >= 0))
		throw new Error("weights must be non-negative");

	const sum = low + medium + high;
	if (Math.abs(sum - 1) > WEIGHT_TOLERANCE)
		throw new Error(`weights must sum to 1, received ${sum}`);
}

function assertValidPrices(prices: TokenPricesUsd) {
	for (const [symbol, price] of Object.entries(prices)) {
		if (!(price > 0)) throw new Error(`${symbol} price must be greater than 0`);
	}
}
