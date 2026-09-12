import { AQUA_CONTRACT_ADDRESSES, NetworkEnum } from "@1inch/aqua-sdk";
import { AQUA_SWAP_VM_CONTRACT_ADDRESSES } from "@1inch/swap-vm-sdk";
import { defineChain } from "viem";
import { robinhood } from "viem/chains";

export const LOCAL_FORK_RPC_URL = "http://localhost:8545";
export const FORK_CHAIN_ID = 1337;

export const robinhoodFork = defineChain({
	...robinhood,
	id: FORK_CHAIN_ID,
	name: "Robinhood Anvil Fork",
	rpcUrls: {
		default: { http: [LOCAL_FORK_RPC_URL] },
	},
});

export const AQUA_CONTRACT = AQUA_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];

export const SWAP_VM_ROUTER =
	AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];

// Impersonate this random address for now
export const maker = "0x74fabbd2e02557dD31c1f7AEf193f95197C5c32C";

export const FAUCET_AMOUNTS = {
	ETH: "1",
	USDG: "10000",
	WETH: "1",
	ONEINCH: "10000",
	TSLA: "100",
} as const;

export const FAUCET_DROPS = [
	{ symbol: "ETH", amount: FAUCET_AMOUNTS.ETH },
	{ symbol: "USDG", amount: FAUCET_AMOUNTS.USDG },
	{ symbol: "WETH", amount: FAUCET_AMOUNTS.WETH },
	{ symbol: "1INCH", amount: FAUCET_AMOUNTS.ONEINCH },
	{ symbol: "TSLA", amount: FAUCET_AMOUNTS.TSLA },
] as const;

export type FaucetAmounts = typeof FAUCET_AMOUNTS;
