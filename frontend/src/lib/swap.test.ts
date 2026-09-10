import { describe, expect, test } from "bun:test";
import {
	Address,
	AquaXYCAmmStrategy,
	HexString,
	MakerTraits,
	Order,
} from "@1inch/swap-vm-sdk";
import { encodeAbiParameters, getAddress, keccak256 } from "viem";
import { maker, SWAP_VM_ROUTER } from "@/config";
import { TOKENS } from "@/constants";
import {
	buildTakerQuoteTx,
	buildTakerSwapTx,
	decodeQuoteResult,
	decodeShippedOrder,
	TAKER_SWAP_AMOUNT_IN,
} from "./swap";

function encodeDemoStrategy(): `0x${string}` {
	const program = AquaXYCAmmStrategy.new().withFeeTokenIn(30).build();
	const order = Order.new({
		maker: new Address(maker),
		program,
		traits: MakerTraits.default(),
	});
	return order.encode().toString() as `0x${string}`;
}

describe("decodeShippedOrder", () => {
	test("round-trips encoded Order bytes", () => {
		const strategy = encodeDemoStrategy();
		const order = decodeShippedOrder(strategy);

		expect(order.maker.toString().toLowerCase()).toBe(maker.toLowerCase());
		expect(order.encode().toString()).toBe(strategy);
	});
});

describe("buildTakerQuoteTx", () => {
	test("targets the AquaSwapVMRouter", () => {
		const strategy = encodeDemoStrategy();
		const tx = buildTakerQuoteTx({ strategy });

		expect(getAddress(tx.to)).toBe(
			getAddress(SWAP_VM_ROUTER.toString() as `0x${string}`),
		);
		expect(tx.data.startsWith("0x")).toBe(true);
		expect(tx.value).toBe(BigInt(0));
	});
});

describe("buildTakerSwapTx", () => {
	test("targets the AquaSwapVMRouter with a threshold", () => {
		const strategy = encodeDemoStrategy();
		const tx = buildTakerSwapTx({
			strategy,
			amountIn: TAKER_SWAP_AMOUNT_IN,
			minAmountOut: BigInt(1),
		});

		expect(getAddress(tx.to)).toBe(
			getAddress(SWAP_VM_ROUTER.toString() as `0x${string}`),
		);
		expect(tx.data.startsWith("0x")).toBe(true);
	});
});

describe("TAKER_SWAP_AMOUNT_IN", () => {
	test("is exactly 10 USDG", () => {
		expect(TAKER_SWAP_AMOUNT_IN).toBe(BigInt(10_000_000));
		expect(getAddress(TOKENS.USDG)).toBe(
			getAddress("0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168"),
		);
	});
});

describe("decodeQuoteResult", () => {
	test("decodes packed quote return data", () => {
		const amountIn = BigInt(10_000_000);
		const amountOut = BigInt("4000000000000000");
		const orderHash = keccak256("0x1234");

		const data = encodeAbiParameters(
			[{ type: "uint256" }, { type: "uint256" }, { type: "bytes32" }],
			[amountIn, amountOut, orderHash],
		);

		const quote = decodeQuoteResult(data);

		expect(quote.amountIn).toBe(amountIn);
		expect(quote.amountOut).toBe(amountOut);
		expect(quote.minAmountOut).toBe((amountOut * BigInt(99)) / BigInt(100));
	});
});

describe("HexString strategy wrapper", () => {
	test("accepts HexString.fromUnknown", () => {
		const strategy = encodeDemoStrategy();
		expect(HexString.fromUnknown(strategy).toString()).toBe(strategy);
	});
});
