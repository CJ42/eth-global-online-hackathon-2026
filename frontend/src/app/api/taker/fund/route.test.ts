import { describe, expect, test } from "bun:test";
import { isAddress } from "viem";
import { maker } from "@/config";

describe("taker fund request validation", () => {
	test("accepts a valid address", () => {
		expect(isAddress(maker)).toBe(true);
	});

	test("rejects invalid addresses", () => {
		expect(isAddress("not-an-address")).toBe(false);
		expect(isAddress("0x1234")).toBe(false);
	});
});
