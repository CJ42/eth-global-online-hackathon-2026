import { describe, expect, test } from "bun:test";
import {
	isUnrecognizedChainError,
	isUnsupportedMethodError,
	isUserRejectedError,
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
