import { PulledEvent, PushedEvent } from "@1inch/aqua-sdk";
import {
	ABI,
	Address,
	HexString,
	Order,
	SwappedEvent,
	SwapVMContract,
	TakerTraits,
} from "@1inch/swap-vm-sdk";
import {
	decodeFunctionResult,
	erc20Abi,
	formatUnits,
	getAddress,
	type Hex,
	type Log,
	parseEventLogs,
	parseUnits,
	type TransactionReceipt,
} from "viem";
import { SWAP_VM_ROUTER } from "@/config";
import { TOKENS } from "@/constants";

/** Fixed exact-in amount for the judge-visible USDG → WETH demo swap. */
export const TAKER_SWAP_AMOUNT_IN = parseUnits("10", 6);
export const TAKER_TOKEN_IN = TOKENS.USDG;
export const TAKER_TOKEN_OUT = TOKENS.WETH;

const swapVm = new SwapVMContract(SWAP_VM_ROUTER);

export type SwapCallInfo = {
	to: Hex;
	data: Hex;
	value: bigint;
};

export type TakerSwapQuote = {
	amountIn: bigint;
	amountOut: bigint;
	minAmountOut: bigint;
};

export type SwapTransferEvidence = {
	token: Hex;
	from: Hex;
	to: Hex;
	amount: string;
	message: string;
};

export type DecodedTakerSwap = {
	swapped: {
		orderHash: Hex;
		maker: Hex;
		taker: Hex;
		tokenIn: Hex;
		tokenOut: Hex;
		amountIn: string;
		amountOut: string;
		message: string;
	} | null;
	pulled: Array<{ token: Hex; amount: string; message: string }>;
	pushed: Array<{ token: Hex; amount: string; message: string }>;
	transfers: SwapTransferEvidence[];
};

export function decodeShippedOrder(strategy: Hex): Order {
	return Order.decode(new HexString(strategy));
}

export function buildTakerQuoteTx({
	strategy,
	amountIn = TAKER_SWAP_AMOUNT_IN,
}: {
	strategy: Hex;
	amountIn?: bigint;
}): SwapCallInfo {
	const order = decodeShippedOrder(strategy);
	const tx = swapVm.quote({
		order,
		tokenIn: new Address(TAKER_TOKEN_IN),
		tokenOut: new Address(TAKER_TOKEN_OUT),
		amount: amountIn,
		takerTraits: TakerTraits.default(),
	});

	return {
		to: tx.to as Hex,
		data: tx.data as Hex,
		value: tx.value ?? BigInt(0),
	};
}

export function decodeQuoteResult(data: Hex): TakerSwapQuote {
	const [amountIn, amountOut] = decodeFunctionResult({
		abi: ABI.SWAP_VM_ABI,
		functionName: "quote",
		data,
	}) as unknown as [bigint, bigint, Hex];

	return {
		amountIn,
		amountOut,
		minAmountOut: (amountOut * BigInt(99)) / BigInt(100),
	};
}

export function buildTakerSwapTx({
	strategy,
	amountIn = TAKER_SWAP_AMOUNT_IN,
	minAmountOut,
	deadlineSeconds = 600,
}: {
	strategy: Hex;
	amountIn?: bigint;
	minAmountOut: bigint;
	deadlineSeconds?: number;
}): SwapCallInfo {
	const order = decodeShippedOrder(strategy);
	const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSeconds);

	const tx = swapVm.swap({
		order,
		tokenIn: new Address(TAKER_TOKEN_IN),
		tokenOut: new Address(TAKER_TOKEN_OUT),
		amount: amountIn,
		takerTraits: TakerTraits.default().with({
			threshold: minAmountOut,
			deadline,
		}),
	});

	return {
		to: tx.to as Hex,
		data: tx.data as Hex,
		value: tx.value ?? BigInt(0),
	};
}

export function decodeTakerSwapReceipt(
	receipt: TransactionReceipt,
): DecodedTakerSwap {
	const swappedLogs = [] as DecodedTakerSwap["swapped"][];
	const pulled: DecodedTakerSwap["pulled"] = [];
	const pushed: DecodedTakerSwap["pushed"] = [];

	for (const log of receipt.logs) {
		try {
			const event = SwappedEvent.fromLog(log);
			swappedLogs.push({
				orderHash: event.orderHash.toString() as Hex,
				maker: event.maker.toString() as Hex,
				taker: event.taker.toString() as Hex,
				tokenIn: event.tokenIn.toString() as Hex,
				tokenOut: event.tokenOut.toString() as Hex,
				amountIn: event.amountIn.toString(),
				amountOut: event.amountOut.toString(),
				message: `Swapped ${formatUnits(event.amountIn, 6)} USDG for ${formatUnits(event.amountOut, 18)} WETH`,
			});
		} catch {
			/* not Swapped */
		}

		try {
			const event = PulledEvent.fromLog(log);
			pulled.push({
				token: event.token.toString() as Hex,
				amount: event.amount.toString(),
				message: `Pulled ${formatTokenAmount(event.token.toString() as Hex, event.amount)} from maker`,
			});
		} catch {
			/* not Pulled */
		}

		try {
			const event = PushedEvent.fromLog(log);
			pushed.push({
				token: event.token.toString() as Hex,
				amount: event.amount.toString(),
				message: `Pushed ${formatTokenAmount(event.token.toString() as Hex, event.amount)} to maker`,
			});
		} catch {
			/* not Pushed */
		}
	}

	const transferLogs = parseEventLogs({
		abi: erc20Abi,
		logs: receipt.logs as Log[],
		eventName: "Transfer",
	});

	const transfers: SwapTransferEvidence[] = transferLogs.map((log) => {
		const token = getAddress(log.address);
		const from = getAddress(log.args.from as Hex);
		const to = getAddress(log.args.to as Hex);
		const amount = log.args.value as bigint;

		return {
			token,
			from,
			to,
			amount: amount.toString(),
			message: `Transfer ${formatTokenAmount(token, amount)} from ${shorten(from)} to ${shorten(to)}`,
		};
	});

	return {
		swapped: swappedLogs.find(Boolean) ?? null,
		pulled,
		pushed,
		transfers,
	};
}

function formatTokenAmount(token: Hex, amount: bigint): string {
	if (getAddress(token) === getAddress(TOKENS.USDG))
		return `${formatUnits(amount, 6)} USDG`;
	if (getAddress(token) === getAddress(TOKENS.WETH))
		return `${formatUnits(amount, 18)} WETH`;
	return `${amount.toString()} ${shorten(token)}`;
}

function shorten(value: string): string {
	return `${value.slice(0, 8)}…${value.slice(-6)}`;
}
