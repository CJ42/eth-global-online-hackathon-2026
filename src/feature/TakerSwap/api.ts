import type { Address, Hex } from "viem";
import type { FaucetAmounts } from "@/config";

export type FundTakerResult = {
	address: Address;
	gasFunded: boolean;
	amounts: FaucetAmounts;
	transfers: {
		USDG: Hex;
		WETH: Hex;
		ONEINCH: Hex;
		TSLA: Hex;
	};
};

export type FaucetResult = {
	address: Address;
	amountWei: string;
};

async function postJson<T>(url: string, body: unknown, fallbackError: string) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});

	const payload = await response.json();

	if (!response.ok) {
		const message = (payload as { error?: string }).error;
		throw new Error(message || fallbackError);
	}

	return payload as T;
}

export async function fundTaker(address: Address): Promise<FundTakerResult> {
	return postJson<FundTakerResult>(
		"/api/taker/fund",
		{ address },
		"Failed to fund taker",
	);
}

export async function requestFaucet(address: Address): Promise<FaucetResult> {
	return postJson<FaucetResult>(
		"/api/faucet",
		{ address },
		"Failed to request faucet ETH",
	);
}
