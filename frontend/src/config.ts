import { AQUA_CONTRACT_ADDRESSES, NetworkEnum } from "@1inch/aqua-sdk";
import { AQUA_SWAP_VM_CONTRACT_ADDRESSES } from "@1inch/swap-vm-sdk";
import {
	createPublicClient,
	createTestClient,
	createWalletClient,
	http,
	publicActions,
	walletActions,
} from "viem";
import { robinhood } from "viem/chains";

export const LOCALHOST_RPC_URL = "http://127.0.0.1:8545";

export const AQUA_CONTRACT = AQUA_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];

export const SWAP_VM_ROUTER =
	AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];

// Impersonate this random address for now
export const maker = "0x74fabbd2e02557dD31c1f7AEf193f95197C5c32C";

export const publicClient = createPublicClient({
	chain: robinhood,
	transport: http(LOCALHOST_RPC_URL),
});

export const testClient = createTestClient({
	chain: robinhood,
	mode: "anvil",
	transport: http(LOCALHOST_RPC_URL),
})
	.extend(publicActions)
	.extend(walletActions);

export const wallet = createWalletClient({
	chain: robinhood,
	transport: http(LOCALHOST_RPC_URL),
	account: maker,
});
