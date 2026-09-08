import { ABI } from "@1inch/aqua-sdk";
import type { Address, Hex, Log, TransactionReceipt } from "viem";
import { formatUnits, getAddress, parseEventLogs } from "viem";
import { TOKEN_ADDRESS_BY_SYMBOL } from "@/constants";
import type { RiskProfile, SleeveId } from "./portfolio";
import { getTokenDecimals } from "./tokens";

const DISPLAY_SYMBOL: Record<string, string> = {
	ONEINCH: "1INCH",
};

const TOKEN_SYMBOL_BY_ADDRESS = new Map(
	Object.entries(TOKEN_ADDRESS_BY_SYMBOL).map(([symbol, address]) => [
		getAddress(address),
		symbol,
	]),
);

export function formatPushedMessage(token: Address, amount: bigint): string {
	const symbol = TOKEN_SYMBOL_BY_ADDRESS.get(getAddress(token));
	const displaySymbol = symbol ? (DISPLAY_SYMBOL[symbol] ?? symbol) : token;
	return `${formatUnits(amount, getTokenDecimals(symbol))} ${displaySymbol} added to strategy`;
}

export const FIXED_SHIP_TOTAL_USD = 1000;

export const RISK_PROFILES = [
	"conservative",
	"balanced",
	"aggressive",
] as const satisfies readonly RiskProfile[];

export type AquaShipEvent =
	| {
			type: "Shipped";
			message: string;
			strategyHash: Hex;
	  }
	| {
			type: "Pushed";
			message: string;
			strategyHash: Hex;
			token: Hex;
			amount: string;
	  };

export type ShippedSleeveResult = {
	sleeve: SleeveId;
	txHash: Hex;
	strategyHash: Hex | null;
	events: AquaShipEvent[];
};

export type ShipPortfolioResult = {
	profile: RiskProfile;
	totalUsd: number;
	approvalHashes: Hex[];
	sleeves: ShippedSleeveResult[];
};

export type ShipPortfolioRequest = {
	profile: RiskProfile;
};

export function isRiskProfile(value: unknown): value is RiskProfile {
	return (
		typeof value === "string" &&
		(RISK_PROFILES as readonly string[]).includes(value)
	);
}

export function parseShipPortfolioRequest(body: unknown): ShipPortfolioRequest {
	if (!body || typeof body !== "object")
		throw new Error("Request body must be a JSON object");

	const profile = (body as { profile?: unknown }).profile;
	if (!isRiskProfile(profile))
		throw new Error(`profile must be one of: ${RISK_PROFILES.join(", ")}`);

	return { profile };
}

export function decodeAquaShipEvents(
	receipt: TransactionReceipt,
): AquaShipEvent[] {
	const logs = parseEventLogs({
		abi: ABI.AQUA_ABI,
		logs: receipt.logs as Log[],
	});

	const events: AquaShipEvent[] = [];

	for (const log of logs) {
		if (log.eventName === "Shipped") {
			events.push({
				type: "Shipped",
				message: "New strategy created",
				strategyHash: log.args.strategyHash as Hex,
			});
			continue;
		}

		if (log.eventName === "Pushed") {
			const token = log.args.token as Address;
			const amount = log.args.amount as bigint;

			events.push({
				type: "Pushed",
				message: formatPushedMessage(token, amount),
				strategyHash: log.args.strategyHash as Hex,
				token: token as Hex,
				amount: amount.toString(),
			});
		}
	}

	return events;
}

export function strategyHashFromEvents(events: AquaShipEvent[]): Hex | null {
	const shipped = events.find((event) => event.type === "Shipped");
	return shipped?.strategyHash ?? null;
}
