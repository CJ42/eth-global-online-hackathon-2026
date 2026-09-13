import { getAddress, isAddress } from "viem";
import { LOCAL_FORK_RPC_URL } from "@/config";
import { fundTakerForSwap } from "../../fork";

export async function POST(request: Request) {
	try {
		const body = await request.json();
		const address = (body as { address?: unknown }).address;

		if (typeof address !== "string" || !isAddress(address))
			throw new Error("address must be a valid EVM address");

		const taker = getAddress(address);
		const funded = await fundTakerForSwap(taker);

		return Response.json({
			address: taker,
			...funded,
		});
	} catch (error) {
		const message =
			error instanceof Error ? error.message : "Failed to fund taker";

		const status = message.startsWith("address must") ? 400 : 500;

		const isRpcFailure =
			message.includes("fetch failed") ||
			message.includes("ECONNREFUSED") ||
			message.includes("HTTP request failed") ||
			message.includes("metadata is not found");

		return Response.json(
			{
				error: isRpcFailure
					? `Cannot reach a healthy Robinhood Anvil fork at ${LOCAL_FORK_RPC_URL}. Restart it with \`bun run chain:start\`.`
					: message,
			},
			{ status: isRpcFailure ? 503 : status },
		);
	}
}
