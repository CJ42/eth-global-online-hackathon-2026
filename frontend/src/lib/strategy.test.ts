import { describe, expect, test } from "bun:test";
import { Address } from "@1inch/aqua-sdk";
import { TOKENS } from "@/constants";
import { generateAquaStrategySalt, type LiquidityProvision } from "./strategy";

const liquidityProvision: LiquidityProvision = [
	{
		token: new Address(TOKENS.USDG),
		amount: BigInt(250_000_000),
	},
	{
		token: new Address(TOKENS.WETH),
		amount: BigInt("100000000000000000"),
	},
];

describe("buildAquaStrategySalt", () => {
	test("is deterministic for the same provision and nonce", () => {
		const input = { liquidityProvision, makerNonce: 42 };
		const salt = generateAquaStrategySalt(input);

		expect(salt).toBe(generateAquaStrategySalt(input));
		expect(salt).toBeLessThanOrEqual(BigInt("18446744073709551615"));
	});

	test("changes when the maker nonce changes", () => {
		const first = generateAquaStrategySalt({
			liquidityProvision,
			makerNonce: 42,
		});
		const second = generateAquaStrategySalt({
			liquidityProvision,
			makerNonce: 43,
		});

		expect(first).not.toBe(second);
	});

	test("changes when the liquidity provision changes", () => {
		const changedProvision: LiquidityProvision = [
			liquidityProvision[0],
			{
				...liquidityProvision[1],
				amount: BigInt("60000000000000000"),
			},
		];

		const first = generateAquaStrategySalt({
			liquidityProvision,
			makerNonce: 42,
		});
		const second = generateAquaStrategySalt({
			liquidityProvision: changedProvision,
			makerNonce: 42,
		});

		expect(first).not.toBe(second);
	});
});
