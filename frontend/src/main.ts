import { Address } from "@1inch/aqua-sdk";

import {
	createTestClient,
	http,
	parseEther,
	parseUnits,
	publicActions,
	walletActions,
} from "viem";
import { robinhood } from "viem/chains";

import { maker, wallet } from "@/config";
import { TOKENS } from "@/constants";
import { distributeInitialTokens, logTokenBalances } from "@/lib/utils";
import { buildAquaStrategy, type LiquidityProvision } from "./lib/strategy";
import { approveAquaToSpendTokens } from "./lib/tokens";

// The user (= liquidity provider) will place 1,000$.
// It will pick "Conservative", it is going to ship as follow:
// - 50% = 500$ in USDG / WETH, so 250$ in USDG, 250$ in WETH
// - 30% = 300$ in

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
		chain: robinhood,
		mode: "anvil", // Or 'hardhat' depending on your node
		transport: http("http://127.0.0.1:8545"),
	})
		.extend(publicActions)
		.extend(walletActions);

	// (Optional) Fund with ETH to pay for transaction gas fees
	await testClient.impersonateAccount({ address: maker });

	// 3. approve Aqua contract to spend tokens
	const usdgAmount = parseUnits("250", 6);
	const wethAmount = parseEther("0.1");

	await approveAquaToSpendTokens(TOKENS.USDG, usdgAmount);
	await approveAquaToSpendTokens(TOKENS.WETH, wethAmount);

	// 4. build strategy to ship
	const liquidityProvision: LiquidityProvision = [
		{
			token: new Address(TOKENS.USDG),
			amount: usdgAmount, // USDG has 6 decimals
		},
		{
			token: new Address(TOKENS.WETH),
			amount: wethAmount,
		},
	];

	const shipTx = buildAquaStrategy(liquidityProvision);

	console.log("💧 Aqua Ship tx: ", shipTx);

	// final: send the transaction
	// TODO: try to run it with `testClient` instead?
	const result = await wallet.sendTransaction(shipTx);
	console.log("Result: ", result);
}

main().catch((err) => console.error(err));
