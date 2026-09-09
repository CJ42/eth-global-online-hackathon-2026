import {
	createTestClient,
	http,
	parseEther,
	parseUnits,
	publicActions,
	walletActions,
} from "viem";
import { robinhood } from "viem/chains";

import { LOCALHOST_RPC_URL, maker } from "@/config";
import { distributeInitialTokens, logTokenBalances } from "@/lib/utils";
import {
	buildPortfolioAllocations,
	FIXED_TOKEN_PRICES_USD,
	PROFILE_WEIGHTS,
} from "./lib/portfolio";
import { shipAquaPortfolio } from "./lib/strategy";

// The user (= liquidity provider) will place 1,000$.
// It will pick "Conservative", it is going to ship as follow:
// - 50% = 500$ in USDG / WETH, so 250$ in USDG, 250$ in WETH
// - 30% = 300$ in WETH / 1INCH, so 150$ in WETH, 150$ in 1INCH
// - 20% = 200$ in USDG / TSLA, so 100$ in USDG, 100$ in TSLA

// Note: for simplicity for now, we assume assume the following fix conversion rates:
// - 1 ETH 		= 2,500.00$
// - 1 1INCH 	=     0.10$
// - 1 TSLA 	=   350.00$

async function main() {
	// 1. fund some initial tokens to liquidity provider (just a lot to get started)
	await distributeInitialTokens("USDG", maker, parseUnits("10000", 6));
	await distributeInitialTokens("WETH", maker, parseEther("1"));
	await distributeInitialTokens("ONEINCH", maker, parseUnits("10000", 18));
	await distributeInitialTokens("TSLA", maker, parseUnits("100", 18));
	await logTokenBalances("after", maker);

	// 2. impersonate liquidity provider on Robinhood mainnet
	// + connect to anvil fork running for Robinhood
	const testClient = createTestClient({
		account: maker,
		chain: robinhood,
		mode: "anvil",
		transport: http(LOCALHOST_RPC_URL),
	})
		.extend(publicActions)
		.extend(walletActions);

	await testClient.setBalance({ address: maker, value: parseEther("1") });
	await testClient.impersonateAccount({ address: maker });

	// 3. calculate Conservative portfolio allocations from fixed prices
	const { allocations } = buildPortfolioAllocations({
		totalUsd: 1000,
		weights: PROFILE_WEIGHTS.conservative,
		prices: FIXED_TOKEN_PRICES_USD,
	});

	console.log("📦 Portfolio allocations:", allocations);

	// 4. approve and ship all three Aqua strategies
	const result = await shipAquaPortfolio({
		walletClient: testClient,
		allocations,
	});

	console.log("💧 Aqua portfolio shipped:", result);
}

main().catch((err) => console.error(err));
