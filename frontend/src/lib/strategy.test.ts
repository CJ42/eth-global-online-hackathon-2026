import { describe, expect, test } from "bun:test";
import { Address } from "@1inch/aqua-sdk";
import { TOKENS } from "@/constants";
import { buildAquaStrategySalt, type LiquidityProvision } from "./strategy";

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
		const salt = buildAquaStrategySalt(input);

		expect(salt).toBe(buildAquaStrategySalt(input));
		expect(salt).toBeLessThanOrEqual(BigInt("18446744073709551615"));
	});

	test("changes when the maker nonce changes", () => {
		const first = buildAquaStrategySalt({
			liquidityProvision,
			makerNonce: 42,
		});
		const second = buildAquaStrategySalt({
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

		const first = buildAquaStrategySalt({
			liquidityProvision,
			makerNonce: 42,
		});
		const second = buildAquaStrategySalt({
			liquidityProvision: changedProvision,
			makerNonce: 42,
		});

		expect(first).not.toBe(second);
	});
});
