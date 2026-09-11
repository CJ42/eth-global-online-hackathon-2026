import { describe, expect, test } from "bun:test";
import { parseUnits } from "viem";
import { TOKENIZED_STOCKS, TOKENS } from "@/constants";
import {
	decodeAquaShipEvents,
	formatPushedMessage,
	isRiskProfile,
	parseShipPortfolioRequest,
	strategyHashFromEvents,
} from "./ship";

describe("parseShipPortfolioRequest", () => {
	test("accepts a valid profile", () => {
		expect(parseShipPortfolioRequest({ profile: "conservative" })).toEqual({
			profile: "conservative",
		});
	});

	test("rejects missing profiles", () => {
		expect(() => parseShipPortfolioRequest({})).toThrow(
			"profile must be one of",
		);
	});

	test("rejects non-objects", () => {
		expect(() => parseShipPortfolioRequest(null)).toThrow(
			"Request body must be a JSON object",
		);
	});
});

describe("isRiskProfile", () => {
	test("validates known profiles", () => {
		expect(isRiskProfile("balanced")).toBe(true);
		expect(isRiskProfile("risky")).toBe(false);
	});
});

describe("strategyHashFromEvents", () => {
	test("returns the shipped strategy hash", () => {
		expect(
			strategyHashFromEvents([
				{
					type: "Pushed",
					message: "250 USDG added to strategy",
					strategyHash:
						"0x1111111111111111111111111111111111111111111111111111111111111111",
					token: "0x2222222222222222222222222222222222222222",
					amount: "1",
				},
				{
					type: "Shipped",
					message: "New strategy created",
					strategyHash:
						"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
				},
			]),
		).toBe(
			"0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
		);
	});

	test("returns null when no shipped event exists", () => {
		expect(strategyHashFromEvents([])).toBeNull();
	});
});

describe("formatPushedMessage", () => {
	test("formats USDG with 6 decimals", () => {
		expect(formatPushedMessage(TOKENS.USDG, parseUnits("250", 6))).toBe(
			"250 USDG added to strategy",
		);
	});

	test("formats WETH with 18 decimals", () => {
		expect(formatPushedMessage(TOKENS.WETH, parseUnits("0.1", 18))).toBe(
			"0.1 WETH added to strategy",
		);
	});

	test("formats ONEINCH as 1INCH", () => {
		expect(formatPushedMessage(TOKENS.ONEINCH, parseUnits("1500", 18))).toBe(
			"1500 1INCH added to strategy",
		);
	});

	test("formats TSLA", () => {
		expect(
			formatPushedMessage(TOKENIZED_STOCKS.TSLA, parseUnits("0.285714", 18)),
		).toBe("0.285714 TSLA added to strategy");
	});
});

describe("decodeAquaShipEvents", () => {
	test("is exported for receipt decoding", () => {
		expect(typeof decodeAquaShipEvents).toBe("function");
	});
});
