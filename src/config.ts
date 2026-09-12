import { AQUA_CONTRACT_ADDRESSES, NetworkEnum } from "@1inch/aqua-sdk";
import { AQUA_SWAP_VM_CONTRACT_ADDRESSES } from "@1inch/swap-vm-sdk";
import { defineChain } from "viem";
import { robinhood } from "viem/chains";

/// @dev I am running a Cloudflare tunnel to expose the local Robinhood fork running on anvil
/// CloudFlare tunnel needs to use an existing domain name from CloudFlare to generate a stable RPC URL
/// Otherwise, the RPC URL is re-generated randomly every time anvil runs.
export const ROBINHOOD_FORK_RPC_URL = "https://rpc.potatotipper.app";
export const LOCAL_FORK_RPC_URL = "http://localhost:8545";
export const FORK_RPC_URLS = [
	ROBINHOOD_FORK_RPC_URL,
	LOCAL_FORK_RPC_URL,
] as const;
export const FORK_CHAIN_ID = 7357171;

// Distinct chain id (anvil --chain-id) so MetaMask treats the fork as a
// custom network instead of merging it with the built-in Robinhood entry
// (which would silently route reads/txs to the public Robinhood RPC).
export const robinhoodFork = defineChain({
	...robinhood,
	id: FORK_CHAIN_ID,
	name: "Robinhood Anvil Fork",
	rpcUrls: {
		default: { http: [...FORK_RPC_URLS] },
	},
});

export const AQUA_CONTRACT = AQUA_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];

export const SWAP_VM_ROUTER =
	AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];

// Impersonate this random address for now
export const maker = "0x74fabbd2e02557dD31c1f7AEf193f95197C5c32C";
