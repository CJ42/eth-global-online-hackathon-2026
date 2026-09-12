/**
 * Local-fork smoke: ship Conservative portfolio, then execute a taker swap
 * via Anvil impersonation (same calldata MetaMask would sign).
 *
 * Run: bun src/scripts/taker-swap-smoke.ts
 */
import {
	createWalletClient,
	erc20Abi,
	fallback,
	formatUnits,
	http,
	parseEther,
} from "viem";

import {
	fundMakerInventory,
	fundTakerForSwap,
	robinhoodForkClient,
} from "../app/api/fork";
import {
	LOCAL_FORK_RPC_URL,
	maker,
	robinhoodFork,
	SWAP_VM_ROUTER,
} from "../config";
import { TOKENS } from "../constants";
import {
	buildPortfolioAllocations,
	FIXED_TOKEN_PRICES_USD,
	PROFILE_WEIGHTS,
} from "../lib/portfolio";
import { FIXED_SHIP_TOTAL_USD } from "../lib/ship";
import { shipAquaPortfolio } from "../lib/strategy";
import {
	buildTakerQuoteTx,
	buildTakerSwapTx,
	decodeQuoteResult,
	decodeTakerSwapReceipt,
	TAKER_SWAP_AMOUNT_IN,
	TAKER_TOKEN_IN,
} from "../lib/swap";

const taker = "0x1111111111111111111111111111111111111111" as const;

export async function runTakerSwapSmoke() {
	console.log("1) Funding maker inventory…");
	await fundMakerInventory();

	await robinhoodForkClient.impersonateAccount({ address: maker });
	await robinhoodForkClient.setBalance({
		address: maker,
		value: parseEther("1"),
	});

	console.log("2) Shipping Conservative portfolio…");
	const { allocations } = buildPortfolioAllocations({
		totalUsd: FIXED_SHIP_TOTAL_USD,
		weights: PROFILE_WEIGHTS.conservative,
		prices: FIXED_TOKEN_PRICES_USD,
	});

	const shipped = await shipAquaPortfolio({
		walletClient: robinhoodForkClient,
		allocations,
	});

	const low = shipped.shipped.find((item) => item.sleeve === "low");
	if (!low) throw new Error("low sleeve missing");
	console.log("   low strategy ready:", low.hash);

	console.log("3) Funding taker with faucet amounts…");
	await fundTakerForSwap(taker);
	await robinhoodForkClient.impersonateAccount({ address: taker });
	await robinhoodForkClient.setBalance({
		address: taker,
		value: parseEther("1"),
	});

	const takerWallet = createWalletClient({
		account: taker,
		chain: robinhoodFork,
		transport: http(robinhoodFork.rpcUrls.default.http[0]),
	});

	const usdgBefore = await robinhoodForkClient.readContract({
		address: TOKENS.USDG,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [taker],
	});
	const wethBefore = await robinhoodForkClient.readContract({
		address: TOKENS.WETH,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [taker],
	});

	console.log("4) Quoting…");
	const quoteTx = buildTakerQuoteTx({ strategy: low.strategy });
	const simulation = await robinhoodForkClient.call({
		account: taker,
		to: quoteTx.to,
		data: quoteTx.data,
	});
	if (!simulation.data) throw new Error("empty quote");
	const quote = decodeQuoteResult(simulation.data);
	console.log("   amountOut WETH:", formatUnits(quote.amountOut, 18));

	console.log("5) Approving router…");
	const approveHash = await takerWallet.writeContract({
		address: TAKER_TOKEN_IN,
		abi: erc20Abi,
		functionName: "approve",
		args: [SWAP_VM_ROUTER.toString() as `0x${string}`, TAKER_SWAP_AMOUNT_IN],
		account: taker,
		chain: robinhoodFork,
	});
	await robinhoodForkClient.waitForTransactionReceipt({ hash: approveHash });

	console.log("6) Swapping…");
	const swapTx = buildTakerSwapTx({
		strategy: low.strategy,
		minAmountOut: quote.minAmountOut,
	});
	const swapHash = await takerWallet.sendTransaction({
		account: taker,
		chain: robinhoodFork,
		to: swapTx.to,
		data: swapTx.data,
		value: swapTx.value,
	});
	const receipt = await robinhoodForkClient.waitForTransactionReceipt({
		hash: swapHash,
	});

	const decoded = decodeTakerSwapReceipt(receipt);
	const usdgAfter = await robinhoodForkClient.readContract({
		address: TOKENS.USDG,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [taker],
	});
	const wethAfter = await robinhoodForkClient.readContract({
		address: TOKENS.WETH,
		abi: erc20Abi,
		functionName: "balanceOf",
		args: [taker],
	});

	console.log("swapHash:", swapHash);
	console.log("swapped:", decoded.swapped?.message);
	console.log("transfers:", decoded.transfers.length);
	console.log("USDG delta:", formatUnits(usdgBefore - usdgAfter, 6));
	console.log("WETH delta:", formatUnits(wethAfter - wethBefore, 18));

	if (!decoded.swapped) throw new Error("missing Swapped event");
	if (decoded.transfers.length < 2)
		throw new Error("expected at least 2 ERC-20 Transfer logs");
	if (usdgAfter >= usdgBefore) throw new Error("USDG did not decrease");
	if (wethAfter <= wethBefore) throw new Error("WETH did not increase");

	console.log("✅ taker swap smoke passed");
}

if (import.meta.main) {
	runTakerSwapSmoke().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
