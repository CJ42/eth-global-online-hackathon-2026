import { describe, expect, test } from "bun:test";
import { parseEther, parseUnits } from "viem";
import {
	buildPortfolioAllocations,
	FIXED_TOKEN_PRICES_USD,
	PROFILE_WEIGHTS,
	TOKEN_META,
} from "./portfolio";
import { usdToTokenAmount } from "./tokens";

describe("usdToTokenAmount", () => {
	test("converts USDG with 6 decimals", () => {
		expect(
			usdToTokenAmount({
				usd: 250,
				priceUsd: 1,
				symbol: "USDG",
			}),
		).toBe(parseUnits("250", 6));
	});

	test("converts WETH at $2500", () => {
		expect(
			usdToTokenAmount({
				usd: 250,
				priceUsd: 2500,
				symbol: "WETH",
			}),
		).toBe(parseEther("0.1"));
	});

	test("floors TSLA amount for $100 at $350", () => {
		expect(
			usdToTokenAmount({
				usd: 100,
				priceUsd: 350,
				symbol: "TSLA",
			}),
		).toBe((BigInt(100) * BigInt(10) ** BigInt(18)) / BigInt(350));
	});

	test("rejects non-positive prices", () => {
		expect(() =>
			usdToTokenAmount({
				usd: 100,
				priceUsd: 0,
				symbol: "TSLA",
			}),
		).toThrow("priceUsd must be greater than 0");
	});
});

describe("buildPortfolioAllocations", () => {
	test("builds Conservative $1000 sleeves and aggregate approvals", () => {
		const { allocations, approvals } = buildPortfolioAllocations({
			totalUsd: 1000,
			weights: PROFILE_WEIGHTS.conservative,
			prices: FIXED_TOKEN_PRICES_USD,
		});

		expect(allocations).toHaveLength(3);

		expect(allocations[0].sleeve).toBe("low");
		expect(allocations[0].usdValue).toBe(500);
		expect(allocations[0].legs[0].amount).toBe(parseUnits("250", 6));
		expect(allocations[0].legs[1].amount).toBe(parseEther("0.1"));

		expect(allocations[1].sleeve).toBe("medium");
		expect(allocations[1].usdValue).toBe(300);
		expect(allocations[1].legs[0].amount).toBe(parseEther("0.06"));
		expect(allocations[1].legs[1].amount).toBe(parseUnits("1500", 18));

		expect(allocations[2].sleeve).toBe("high");
		expect(allocations[2].usdValue).toBe(200);
		expect(allocations[2].legs[0].amount).toBe(parseUnits("100", 6));
		expect(allocations[2].legs[1].amount).toBe(
			(BigInt(100) * BigInt(10) ** BigInt(18)) / BigInt(350),
		);

		const bySymbol = Object.fromEntries(
			approvals.map((approval) => [approval.token.symbol, approval.amount]),
		);

		expect(bySymbol.USDG).toBe(parseUnits("350", 6));
		expect(bySymbol.WETH).toBe(parseEther("0.16"));
		expect(bySymbol.ONEINCH).toBe(parseUnits("1500", 18));
		expect(bySymbol.TSLA).toBe(
			(BigInt(100) * BigInt(10) ** BigInt(18)) / BigInt(350),
		);
		expect(approvals).toHaveLength(4);
	});

	test("rejects weights that do not sum to 1", () => {
		expect(() =>
			buildPortfolioAllocations({
				totalUsd: 1000,
				weights: { low: 0.5, medium: 0.3, high: 0.3 },
				prices: FIXED_TOKEN_PRICES_USD,
			}),
		).toThrow("weights must sum to 1");
	});

	test("rejects non-positive token prices", () => {
		expect(() =>
			buildPortfolioAllocations({
				totalUsd: 1000,
				weights: PROFILE_WEIGHTS.conservative,
				prices: {
					...FIXED_TOKEN_PRICES_USD,
					WETH: 0,
				},
			}),
		).toThrow("WETH price must be greater than 0");
	});

	test("rejects non-positive totalUsd", () => {
		expect(() =>
			buildPortfolioAllocations({
				totalUsd: 0,
				weights: PROFILE_WEIGHTS.conservative,
				prices: FIXED_TOKEN_PRICES_USD,
			}),
		).toThrow("totalUsd must be greater than 0");
	});

	test("uses default TSLA high-risk stock metadata", () => {
		const { allocations } = buildPortfolioAllocations({
			totalUsd: 1000,
			weights: PROFILE_WEIGHTS.conservative,
			prices: FIXED_TOKEN_PRICES_USD,
		});

		expect(allocations[2].legs[1].token).toEqual(TOKEN_META.TSLA);
	});
});
