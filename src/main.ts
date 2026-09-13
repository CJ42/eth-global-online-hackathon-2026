import { parseEther, parseUnits } from "viem";
import { maker } from "@/config";
import {
	distributeInitialTokens,
	logTokenBalances,
	robinhoodForkClient,
} from "./lib/fork";
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
	await distributeInitialTokens({
		tokenSymbol: "USDG",
		recipient: maker,
		amount: parseUnits("10000", 6),
	});
	await distributeInitialTokens({
		tokenSymbol: "WETH",
		recipient: maker,
		amount: parseEther("1"),
	});
	await distributeInitialTokens({
		tokenSymbol: "ONEINCH",
		recipient: maker,
		amount: parseUnits("10000", 18),
	});
	await distributeInitialTokens({
		tokenSymbol: "TSLA",
		recipient: maker,
		amount: parseUnits("100", 18),
	});
	await logTokenBalances("after", maker);

	await robinhoodForkClient.setBalance({
		address: maker,
		value: parseEther("1"),
	});
	await robinhoodForkClient.impersonateAccount({ address: maker });

	const { allocations } = buildPortfolioAllocations({
		totalUsd: 1000,
		weights: PROFILE_WEIGHTS.conservative,
		prices: FIXED_TOKEN_PRICES_USD,
	});

	console.log("📦 Portfolio allocations:", allocations);

	const result = await shipAquaPortfolio({
		walletClient: robinhoodForkClient,
		allocations,
	});

	console.log("💧 Aqua portfolio shipped:", result);
}

main().catch((err) => console.error(err));
