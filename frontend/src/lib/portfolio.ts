import type { Address } from "viem";
import { TOKENIZED_STOCKS, TOKENS } from "@/constants";

export type RiskProfile = "conservative" | "balanced" | "aggressive";

export type SleeveId = "low" | "medium" | "high";

export interface TokenMeta {
	symbol: string;
	address: Address;
	decimals: number;
}

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

export interface PairAllocation {
	sleeve: SleeveId;
	usdValue: number;
	legs: [LiquidityLeg, LiquidityLeg];
}

export interface TokenApproval {
	token: TokenMeta;
	amount: bigint;
}

export interface BuildPortfolioAllocationsInput {
	totalUsd: number;
	weights: SleeveWeights;
	prices: TokenPricesUsd;
	highRiskStock?: TokenMeta;
}

export interface BuildPortfolioAllocationsResult {
	allocations: [PairAllocation, PairAllocation, PairAllocation];
	approvals: TokenApproval[];
}

export const PROFILE_WEIGHTS = {
	conservative: { low: 0.5, medium: 0.3, high: 0.2 },
	balanced: { low: 0.25, medium: 0.5, high: 0.25 },
	aggressive: { low: 0.2, medium: 0.3, high: 0.5 },
} as const satisfies Record<RiskProfile, SleeveWeights>;

export const TOKEN_META = {
	USDG: {
		symbol: "USDG",
		address: TOKENS.USDG,
		decimals: 6,
	},
	WETH: {
		symbol: "WETH",
		address: TOKENS.WETH,
		decimals: 18,
	},
	ONEINCH: {
		symbol: "ONEINCH",
		address: TOKENS.ONEINCH,
		decimals: 18,
	},
	TSLA: {
		symbol: "TSLA",
		address: TOKENIZED_STOCKS.TSLA,
		decimals: 18,
	},
} as const satisfies Record<string, TokenMeta>;

export const FIXED_TOKEN_PRICES_USD = {
	USDG: 1,
	WETH: 2500,
	ONEINCH: 0.1,
	TSLA: 350,
} as const satisfies TokenPricesUsd;

const PRICE_SCALE = 1_000_000_000;
const WEIGHT_TOLERANCE = 1e-9;

export function buildPortfolioAllocations({
	totalUsd,
	weights,
	prices,
	highRiskStock = TOKEN_META.TSLA,
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
			tokenB: highRiskStock,
			priceA: prices.USDG,
			priceB: getStockPrice({ stock: highRiskStock, prices }),
		}),
	];

	return {
		allocations,
		approvals: aggregateApprovals(allocations),
	};
}

export function usdToTokenAmount({
	usd,
	priceUsd,
	decimals,
}: {
	usd: number;
	priceUsd: number;
	decimals: number;
}): bigint {
	if (!(usd >= 0)) throw new Error("usd must be non-negative");
	if (!(priceUsd > 0)) throw new Error("priceUsd must be greater than 0");
	if (!(Number.isInteger(decimals) && decimals >= 0))
		throw new Error("decimals must be a non-negative integer");

	const usdScaled = BigInt(Math.round(usd * PRICE_SCALE));
	const priceScaled = BigInt(Math.round(priceUsd * PRICE_SCALE));

	return (usdScaled * BigInt(10) ** BigInt(decimals)) / priceScaled;
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
					decimals: tokenA.decimals,
				}),
			},
			{
				token: tokenB,
				usdValue: halfUsd,
				amount: usdToTokenAmount({
					usd: halfUsd,
					priceUsd: priceB,
					decimals: tokenB.decimals,
				}),
			},
		],
	};
}

function aggregateApprovals(allocations: PairAllocation[]): TokenApproval[] {
	const byAddress = new Map<string, TokenApproval>();

	for (const allocation of allocations) {
		for (const leg of allocation.legs) {
			const existing = byAddress.get(leg.token.address);
			if (!existing) {
				byAddress.set(leg.token.address, {
					token: leg.token,
					amount: leg.amount,
				});
				continue;
			}

			existing.amount += leg.amount;
		}
	}

	return [...byAddress.values()];
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

function getStockPrice({
	stock,
	prices,
}: {
	stock: TokenMeta;
	prices: TokenPricesUsd;
}): number {
	if (stock.symbol === "TSLA") return prices.TSLA;
	throw new Error(`missing price for stock ${stock.symbol}`);
}
