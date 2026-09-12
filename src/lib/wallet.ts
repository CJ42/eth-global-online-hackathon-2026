import {
	FORK_RPC_URLS,
	LOCAL_FORK_RPC_URL,
	robinhoodFork,
} from "@/config";

export type EthereumProvider = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
	on?: (event: string, handler: (...args: unknown[]) => void) => void;
	removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
	isMetaMask?: boolean;
	providers?: EthereumProvider[];
};

declare global {
	interface Window {
		ethereum?: EthereumProvider;
	}
}

export const FORK_CHAIN_ID_HEX = `0x${robinhoodFork.id.toString(16)}`;

const ROBINHOOD_NETWORK_PARAMS = {
	chainId: FORK_CHAIN_ID_HEX,
	chainName: robinhoodFork.name,
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: [...FORK_RPC_URLS],
};

export function getEthereumProvider(): EthereumProvider {
	if (!window.ethereum)
		throw new Error("A browser wallet is required. Install MetaMask and retry.");

	const metamask = window.ethereum.providers?.find(
		(provider) => provider.isMetaMask,
	);
	return metamask ?? window.ethereum;
}

export async function ensureRobinhoodNetwork(provider: EthereumProvider) {
	const chainId = (await provider.request({ method: "eth_chainId" })) as string;
	if (chainId.toLowerCase() === FORK_CHAIN_ID_HEX.toLowerCase()) return;

	try {
		await provider.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId: FORK_CHAIN_ID_HEX }],
		});
	} catch (switchError) {
		if (isUserRejectedError(switchError)) throw switchError;
		if (!isUnrecognizedChainError(switchError)) {
			throw new Error(manualNetworkMessage());
		}

		try {
			await provider.request({
				method: "wallet_addEthereumChain",
				params: [ROBINHOOD_NETWORK_PARAMS],
			});
		} catch (addError) {
			if (isUserRejectedError(addError)) throw addError;
			throw new Error(manualNetworkMessage());
		}
	}
}

export function isUnrecognizedChainError(error: unknown) {
	const code = errorCode(error);
	const message = errorMessage(error).toLowerCase();
	return (
		code === 4902 ||
		message.includes("unrecognized chain") ||
		message.includes("unknown chain")
	);
}

export function isUserRejectedError(error: unknown) {
	return errorCode(error) === 4001;
}

export function isUnsupportedMethodError(error: unknown) {
	const code = errorCode(error);
	const message = errorMessage(error).toLowerCase();
	return (
		code === 4200 ||
		code === -32601 ||
		message.includes("not supported") ||
		message.includes("method not found")
	);
}

export function shortenAddress(value: string) {
	return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function manualNetworkMessage() {
	return `Add ${robinhoodFork.name} in your wallet (chain ID ${robinhoodFork.id}, RPC ${LOCAL_FORK_RPC_URL}), then connect again.`;
}

function errorCode(error: unknown) {
	if (typeof error === "object" && error && "code" in error)
		return Number((error as { code: unknown }).code);
}

function errorMessage(error: unknown) {
	if (error instanceof Error) return error.message;
	if (typeof error === "object" && error && "message" in error)
		return String((error as { message: unknown }).message);
	return String(error);
}
