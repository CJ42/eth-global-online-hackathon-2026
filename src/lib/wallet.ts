import { getAddress, numberToHex } from "viem";
import {
	LOCAL_FORK_RPC_URL,
	robinhoodFork,
} from "@/config";

export type EthereumProvider = {
	request: (args: { method: string; params?: unknown }) => Promise<unknown>;
	on?: (event: string, handler: (...args: unknown[]) => void) => void;
	removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
	isMetaMask?: boolean;
	providers?: EthereumProvider[];
};

export type WatchableToken = {
	address: string;
	symbol: string;
	decimals: number;
};

declare global {
	interface Window {
		ethereum?: EthereumProvider;
	}
}

const ROBINHOOD_NETWORK_PARAMS = {
	chainId: numberToHex(robinhoodFork.id),
	chainName: robinhoodFork.name,
	nativeCurrency: {
		name: "Ether",
		symbol: "ETH",
		decimals: 18,
	},
	rpcUrls: [LOCAL_FORK_RPC_URL],
};

export function getEthereumProvider(): EthereumProvider {
	if (!window.ethereum)
		throw new Error("A browser wallet is required. Install MetaMask and retry.");

	const metamask = window.ethereum.providers?.find(
		(provider) => provider.isMetaMask,
	);
	return metamask ?? window.ethereum;
}

export async function watchToken(
	provider: EthereumProvider,
	token: WatchableToken,
) {
	await ensureRobinhoodNetwork(provider);

	return provider.request({
		method: "wallet_watchAsset",
		params: {
			type: "ERC20",
			options: {
				address: getAddress(token.address),
				symbol: token.symbol,
				decimals: token.decimals,
			},
		},
	});
}

export async function ensureRobinhoodNetwork(provider: EthereumProvider) {
	await provider.request({ method: "eth_requestAccounts" });
	if (await isOnRobinhoodFork(provider)) return;

	const chainId = numberToHex(robinhoodFork.id);

	try {
		await provider.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId }],
		});
	} catch (switchError) {
		if (isUserRejectedError(switchError)) throw switchError;

		try {
			await provider.request({
				method: "wallet_addEthereumChain",
				params: [ROBINHOOD_NETWORK_PARAMS],
			});
		} catch (addError) {
			if (isUserRejectedError(addError)) throw addError;
			throw new Error(manualNetworkMessage());
		}

		await provider.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId }],
		});
	}

	if (!(await isOnRobinhoodFork(provider)))
		throw new Error(manualNetworkMessage());
}

async function isOnRobinhoodFork(provider: EthereumProvider) {
	const chainId = String(await provider.request({ method: "eth_chainId" }));
	return chainId.toLowerCase() === numberToHex(robinhoodFork.id).toLowerCase();
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

export function formatWalletError(error: unknown, fallback: string) {
	if (isUserRejectedError(error)) return "Request cancelled.";
	if (error instanceof Error && error.message) return error.message;
	return fallback;
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
