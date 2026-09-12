import {
	type Address,
	createTestClient,
	erc20Abi,
	http,
	formatEther,
	formatUnits,
	type Hex,
	parseEther,
	parseUnits,
	publicActions,
	walletActions,
} from "viem";
import { FAUCET_AMOUNTS, maker, robinhoodFork } from "@/config";
import {
	type AvailableWhaleTokens,
	TOKEN_ADDRESS_BY_SYMBOL,
	TOKEN_WHALE,
	TOKENIZED_STOCKS,
	TOKENS,
} from "@/constants";
import { getTokenDecimals } from "@/lib/tokens";

export const robinhoodForkClient = createTestClient({
	account: maker,
	chain: robinhoodFork,
	mode: "anvil",
	transport: http(robinhoodFork.rpcUrls.default.http[0]),
})
	.extend(publicActions)
	.extend(walletActions);

export async function distributeInitialTokens({
	tokenSymbol,
	recipient,
	amount,
}: {
	tokenSymbol: AvailableWhaleTokens;
	recipient: Address;
	amount: bigint;
}): Promise<Hex> {
	const tokenWhale = TOKEN_WHALE[tokenSymbol];
	const tokenAddress = TOKEN_ADDRESS_BY_SYMBOL[tokenSymbol];

	await robinhoodForkClient.impersonateAccount({ address: tokenWhale });
	await robinhoodForkClient.setBalance({
		address: tokenWhale,
		// Robinhood fork base fees can be high; keep whales well-funded for transfers.
		value: parseEther("100"),
	});

	const hash = await robinhoodForkClient.writeContract({
		address: tokenAddress,
		abi: erc20Abi,
		functionName: "transfer",
		args: [recipient, amount],
		account: tokenWhale,
	});

	await robinhoodForkClient.waitForTransactionReceipt({ hash });
	await robinhoodForkClient.stopImpersonatingAccount({ address: tokenWhale });

	return hash;
}

export async function fundMakerInventory(): Promise<void> {
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
}

const FAUCET_ETH = parseEther(FAUCET_AMOUNTS.ETH);
const FAUCET_TOKEN_SYMBOLS = ["USDG", "WETH", "ONEINCH", "TSLA"] as const;

export async function fundNativeEth(address: Address): Promise<{
	address: Address;
	amountWei: string;
}> {
	await robinhoodForkClient.setBalance({
		address,
		value: FAUCET_ETH,
	});

	return {
		address,
		amountWei: FAUCET_ETH.toString(),
	};
}

export async function fundTakerForSwap(taker: Address): Promise<{
	gasFunded: boolean;
	amounts: typeof FAUCET_AMOUNTS;
	transfers: Record<(typeof FAUCET_TOKEN_SYMBOLS)[number], Hex>;
}> {
	await fundNativeEth(taker);

	const transfers = {
		USDG: await distributeInitialTokens({
			tokenSymbol: "USDG",
			recipient: taker,
			amount: parseUnits(FAUCET_AMOUNTS.USDG, getTokenDecimals("USDG")),
		}),
		WETH: await distributeInitialTokens({
			tokenSymbol: "WETH",
			recipient: taker,
			amount: parseUnits(FAUCET_AMOUNTS.WETH, getTokenDecimals("WETH")),
		}),
		ONEINCH: await distributeInitialTokens({
			tokenSymbol: "ONEINCH",
			recipient: taker,
			amount: parseUnits(FAUCET_AMOUNTS.ONEINCH, getTokenDecimals("ONEINCH")),
		}),
		TSLA: await distributeInitialTokens({
			tokenSymbol: "TSLA",
			recipient: taker,
			amount: parseUnits(FAUCET_AMOUNTS.TSLA, getTokenDecimals("TSLA")),
		}),
	};

	return {
		gasFunded: true,
		amounts: FAUCET_AMOUNTS,
		transfers,
	};
}

export async function logTokenBalances(label: string, address: Address) {
	const [usdgBalance, wethBalance, oneinchBalance, tslaBalance] =
		await Promise.all([
			robinhoodForkClient.readContract({
				address: TOKENS.USDG,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [address],
			}),
			robinhoodForkClient.readContract({
				address: TOKENS.WETH,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [address],
			}),
			robinhoodForkClient.readContract({
				address: TOKENS.ONEINCH,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [address],
			}),
			robinhoodForkClient.readContract({
				address: TOKENIZED_STOCKS.TSLA,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [address],
			}),
		]);

	console.log(`${label} USDG: ${formatUnits(usdgBalance, 6)}`);
	console.log(`${label} WETH: ${formatEther(wethBalance)}`);
	console.log(`${label} 1INCH: ${formatUnits(oneinchBalance, 18)}`);
	console.log(`${label} TSLA: ${formatUnits(tslaBalance, 18)}`);
}
