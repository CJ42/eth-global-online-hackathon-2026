import { ROBINHOOD_FORK_RPC_URL, robinhoodFork } from "@/config";

export type EthereumProvider = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
	on?: (event: string, handler: (...args: unknown[]) => void) => void;
	removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

declare global {
	interface Window {
		ethereum?: EthereumProvider;
	}
}

const FORK_CHAIN_ID_HEX = `0x${robinhoodFork.id.toString(16)}`;

export function getEthereumProvider(): EthereumProvider {
	if (!window.ethereum)
		throw new Error("MetaMask is required. Install it and retry.");
	return window.ethereum;
}

export async function ensureRobinhoodNetwork(provider: EthereumProvider) {
	try {
		await provider.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId: FORK_CHAIN_ID_HEX }],
		});
	} catch {
		await provider.request({
			method: "wallet_addEthereumChain",
			params: [
				{
					chainId: FORK_CHAIN_ID_HEX,
					chainName: "Robinhood Anvil Fork",
					nativeCurrency: {
						name: "Ether",
						symbol: "ETH",
						decimals: 18,
					},
					rpcUrls: [ROBINHOOD_FORK_RPC_URL],
				},
			],
		});
	}
}

export function shortenAddress(value: string) {
	return `${value.slice(0, 6)}…${value.slice(-4)}`;
}
