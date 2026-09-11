import { parseEther } from "viem";
import { maker } from "@/config";
import {
	buildPortfolioAllocations,
	FIXED_TOKEN_PRICES_USD,
	PROFILE_WEIGHTS,
} from "@/lib/portfolio";
import {
	decodeAquaShipEvents,
	FIXED_SHIP_TOTAL_USD,
	parseShipPortfolioRequest,
	type ShipPortfolioResult,
	type ShippedSleeveResult,
	strategyHashFromEvents,
} from "@/lib/ship";
import { shipAquaPortfolio } from "@/lib/strategy";
import { fundMakerInventory, robinhoodForkClient } from "../fork";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const { profile } = parseShipPortfolioRequest(body);

		await fundMakerInventory();

		await robinhoodForkClient.impersonateAccount({ address: maker });
		await robinhoodForkClient.setBalance({
			address: maker,
			value: parseEther("1"),
		});

		const { allocations } = buildPortfolioAllocations({
			totalUsd: FIXED_SHIP_TOTAL_USD,
			weights: PROFILE_WEIGHTS[profile],
			prices: FIXED_TOKEN_PRICES_USD,
		});

		const shipResult = await shipAquaPortfolio({
			walletClient: robinhoodForkClient,
			allocations,
		});

		const sleeves: ShippedSleeveResult[] = [];

		for (const shipped of shipResult.shipped) {
			const events = decodeAquaShipEvents(shipped.receipt);

			sleeves.push({
				sleeve: shipped.sleeve,
				txHash: shipped.hash,
				strategyHash: strategyHashFromEvents(events),
				strategy: shipped.strategy,
				events,
			});
		}

		const result: ShipPortfolioResult = {
			profile,
			totalUsd: FIXED_SHIP_TOTAL_USD,
			approvalHashes: shipResult.approvalHashes,
			sleeves,
		};

		return Response.json(result);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to ship portfolio";

		const status =
			message.startsWith("profile must") || message.startsWith("Request body")
				? 400
				: 500;

		const isRpcFailure =
			message.includes("fetch failed") ||
			message.includes("ECONNREFUSED") ||
			message.includes("HTTP request failed") ||
			message.includes("metadata is not found");

		return Response.json(
			{
				error: isRpcFailure
					? "Cannot reach a healthy local Robinhood Anvil fork at 127.0.0.1:8545. Restart with `bun run chain:start`."
					: message,
			},
			{ status: isRpcFailure ? 503 : status },
		);
	}
}
