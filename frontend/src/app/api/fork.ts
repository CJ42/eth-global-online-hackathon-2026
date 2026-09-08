import { createTestClient, http, publicActions, walletActions } from "viem";
import { robinhood } from "viem/chains";
import { LOCALHOST_RPC_URL, maker } from "@/config";

export const robinhoodForkClient = createTestClient({
	account: maker,
	chain: robinhood,
	mode: "anvil",
	transport: http(LOCALHOST_RPC_URL),
})
	.extend(publicActions)
	.extend(walletActions);
