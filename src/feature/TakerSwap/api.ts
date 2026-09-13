import type { Address, Hex } from "viem";
import { type FaucetAmounts, LOCAL_FORK_RPC_URL } from "@/config";
import { fundTakerForSwap } from "@/lib/fork";

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

/**
 * Fund the connected wallet straight from the browser: the Anvil fork accepts
 * unauthenticated anvil_* JSON-RPC, so no backend is needed.
 */
export async function fundTaker(address: Address): Promise<FundTakerResult> {
	try {
		const funded = await fundTakerForSwap(address);
		return { address, ...funded };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);

		const isRpcFailure =
			message.includes("fetch failed") ||
			message.includes("Failed to fetch") ||
			message.includes("ECONNREFUSED") ||
			message.includes("HTTP request failed") ||
			message.includes("metadata is not found");

		if (isRpcFailure)
			throw new Error(
				`Cannot reach a healthy Robinhood Anvil fork at ${LOCAL_FORK_RPC_URL}. Start it with \`bun run chain:start\`.`,
			);

		throw error;
	}
}
