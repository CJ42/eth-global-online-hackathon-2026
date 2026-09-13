import {
	type Account,
	type Address,
	erc20Abi,
	formatUnits,
	type Hex,
	type WalletClient,
} from "viem";
import { AQUA_CONTRACT } from "@/config";

const PRICE_SCALE = 1_000_000_000;

export function getTokenDecimals(symbol?: string): number {
	return symbol === "USDG" ? 6 : 18;
}

export function tokenAmountToUsd({
	amount,
	priceUsd,
	symbol,
}: {
	amount: bigint;
	priceUsd: number;
	symbol: string;
}): number {
	const decimals = getTokenDecimals(symbol);
	return Number(formatUnits(amount, decimals)) * priceUsd;
}

export function usdToTokenAmount({
	usd,
	priceUsd,
	symbol,
}: {
	usd: number;
	priceUsd: number;
	symbol: string;
}): bigint {
	if (!(usd >= 0)) throw new Error("usd must be non-negative");
	if (!(priceUsd > 0)) throw new Error("priceUsd must be greater than 0");

	const usdScaled = BigInt(Math.round(usd * PRICE_SCALE));
	const priceScaled = BigInt(Math.round(priceUsd * PRICE_SCALE));

	return (
		(usdScaled * BigInt(10) ** BigInt(getTokenDecimals(symbol))) / priceScaled
	);
}

export async function approveAquaToSpendTokens({
	walletClient,
	token,
	amount,
}: {
	walletClient: WalletClient;
	token: Address;
	amount: bigint;
}): Promise<Hex> {
	const { account } = walletClient;
	return walletClient.writeContract({
		address: token,
		abi: erc20Abi,
		functionName: "approve",
		args: [AQUA_CONTRACT.toString(), amount],
		account: account as Account,
		chain: walletClient.chain,
	});
}
