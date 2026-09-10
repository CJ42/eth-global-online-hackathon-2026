import { getAddress, isAddress } from "viem";
import { fundNativeEth } from "../fork";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const address = (body as { address?: unknown }).address;

		if (typeof address !== "string" || !isAddress(address))
			throw new Error("address must be a valid EVM address");

		const funded = await fundNativeEth(getAddress(address));

		return Response.json(funded);
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to fund native ETH";

		const status = message.startsWith("address must") ? 400 : 500;

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
