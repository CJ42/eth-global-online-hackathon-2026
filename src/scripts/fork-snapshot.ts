/**
 * Build `robinhood-fork-snapshot.json` from a LIVE Anvil fork (`bun run chain:fork`).
 *
 * The public Robinhood RPC only serves state for the most recent ~10 minutes of
 * blocks (~100 ms block time). A fork older than that can no longer load any
 * account it has not already cached, so ship()/swap() silently hang.
 *
 * This script warms every account and storage slot the demo touches, then dumps
 * the state so `bun run chain:start` can run Anvil standalone with no upstream.
 *
 * Run: bun run chain:snapshot
 */
import { writeFileSync } from "node:fs";
import { hexToBytes, parseEther } from "viem";

import { fundMakerInventory, robinhoodForkClient } from "../lib/fork";
import { LOCAL_FORK_RPC_URL, maker } from "../config";
import {
	buildPortfolioAllocations,
	FIXED_TOKEN_PRICES_USD,
	PROFILE_WEIGHTS,
	type RiskProfile,
} from "../lib/portfolio";
import { FIXED_SHIP_TOTAL_USD } from "../lib/ship";
import { shipAquaPortfolio } from "../lib/strategy";
import { runTakerSwapSmoke } from "./taker-swap-smoke";

export const SNAPSHOT_PATH = "robinhood-fork-snapshot.json";

async function assertLiveFork() {
	const response = await fetch(LOCAL_FORK_RPC_URL, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({
			jsonrpc: "2.0",
			id: 1,
			method: "anvil_nodeInfo",
			params: [],
		}),
	});
	const { result } = (await response.json()) as {
		result?: { forkConfig?: { forkUrl?: string | null } };
	};

	if (!result?.forkConfig?.forkUrl)
		throw new Error(
			"Anvil is not forking upstream. Start a fresh live fork first: `bun run chain:fork`.",
		);
}

async function shipProfile(profile: RiskProfile) {
	const { allocations } = buildPortfolioAllocations({
		totalUsd: FIXED_SHIP_TOTAL_USD,
		weights: PROFILE_WEIGHTS[profile],
		prices: FIXED_TOKEN_PRICES_USD,
	});
	await shipAquaPortfolio({ walletClient: robinhoodForkClient, allocations });
}

function decodeDump(hex: `0x${string}`) {
	const bytes = new Uint8Array(hexToBytes(hex));
	try {
		return new TextDecoder().decode(Bun.gunzipSync(bytes));
	} catch {
		return new TextDecoder().decode(bytes);
	}
}

async function main() {
	await assertLiveFork();

	// Conservative ship + taker swap: same path the UI takes.
	await runTakerSwapSmoke();

	console.log("7) Shipping Balanced + Aggressive to warm every sleeve…");
	await fundMakerInventory();
	await robinhoodForkClient.impersonateAccount({ address: maker });
	await robinhoodForkClient.setBalance({ address: maker, value: parseEther("1") });
	await shipProfile("balanced");
	await shipProfile("aggressive");

	console.log("8) Dumping state…");
	const dump = decodeDump(await robinhoodForkClient.dumpState());
	writeFileSync(SNAPSHOT_PATH, dump);

	const accounts = Object.keys(JSON.parse(dump).accounts ?? {}).length;
	console.log(`✅ wrote ${SNAPSHOT_PATH} (${accounts} accounts)`);
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
