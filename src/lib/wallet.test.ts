import { describe, expect, test } from "bun:test";
import { getAddress, numberToHex } from "viem";
import { robinhoodFork } from "@/config";
import { TOKENS } from "@/constants";
import {
	ensureRobinhoodNetwork,
	isUnrecognizedChainError,
	isUnsupportedMethodError,
	isUserRejectedError,
	watchToken,
} from "./wallet";

describe("wallet rpc errors", () => {
	test("treats 4902 as an unrecognized chain", () => {
		expect(isUnrecognizedChainError({ code: 4902 })).toBe(true);
		expect(
			isUnrecognizedChainError({ message: "Unrecognized chain ID" }),
		).toBe(true);
		expect(isUnrecognizedChainError({ code: 4001 })).toBe(false);
	});

	test("treats wallet_addEthereumChain as unsupported", () => {
		expect(
			isUnsupportedMethodError({
				code: 4200,
				message: "Request method wallet_addEthereumChain is not supported",
			}),
		).toBe(true);
		expect(isUnsupportedMethodError({ code: -32601 })).toBe(true);
		expect(isUnsupportedMethodError({ code: 4902 })).toBe(false);
	});

	test("treats 4001 as a user rejection", () => {
		expect(isUserRejectedError({ code: 4001 })).toBe(true);
		expect(isUserRejectedError({ code: 4902 })).toBe(false);
	});
});

describe("watchToken", () => {
	test("connects, stays on the fork, then sends checksummed wallet_watchAsset", async () => {
		const calls: Array<{ method: string; params?: unknown }> = [];
		const provider = {
			request: async (args: { method: string; params?: unknown }) => {
				calls.push(args);
				if (args.method === "eth_requestAccounts")
					return ["0x74fabbd2e02557dD31c1f7AEf193f95197C5c32C"];
				if (args.method === "eth_chainId") return numberToHex(robinhoodFork.id);
				return true;
			},
		};

		await watchToken(provider, {
			address: TOKENS.USDG.toLowerCase(),
			symbol: "USDG",
			decimals: 6,
		});

		expect(calls.map((call) => call.method)).toEqual([
			"eth_requestAccounts",
			"eth_chainId",
			"wallet_watchAsset",
		]);
		expect(calls[2]).toEqual({
			method: "wallet_watchAsset",
			params: {
				type: "ERC20",
				options: {
					address: getAddress(TOKENS.USDG),
					symbol: "USDG",
					decimals: 6,
				},
			},
		});
	});
});

describe("ensureRobinhoodNetwork", () => {
	test("adds the fork then switches the wallet onto localhost", async () => {
		const forkId = numberToHex(robinhoodFork.id);
		let chainId = "0x1";
		let added = false;
		const calls: string[] = [];
		const provider = {
			request: async (args: { method: string; params?: unknown }) => {
				calls.push(args.method);
				if (args.method === "eth_requestAccounts")
					return ["0x74fabbd2e02557dD31c1f7AEf193f95197C5c32C"];
				if (args.method === "eth_chainId") return chainId;
				if (args.method === "wallet_switchEthereumChain") {
					if (!added) {
						const error = Object.assign(new Error("Unrecognized chain"), {
							code: 4902,
						});
						throw error;
					}
					chainId = forkId;
					return null;
				}
				if (args.method === "wallet_addEthereumChain") {
					added = true;
					return null;
				}
			},
		};

		await ensureRobinhoodNetwork(provider);

		expect(calls).toEqual([
			"eth_requestAccounts",
			"eth_chainId",
			"wallet_switchEthereumChain",
			"wallet_addEthereumChain",
			"wallet_switchEthereumChain",
			"eth_chainId",
		]);
		expect(chainId).toBe(forkId);
	});
});
