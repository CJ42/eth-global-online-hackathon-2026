import {
	type Address,
	createTestClient,
	erc20Abi,
	formatEther,
	formatUnits,
	type Hex,
	http,
	parseEther,
	parseUnits,
	publicActions,
	walletActions,
} from "viem";
import { ROBINHOOD_FORK_RPC_URL, maker, robinhoodFork } from "@/config";
import {
	type AvailableWhaleTokens,
	TOKEN_ADDRESS_BY_SYMBOL,
	TOKEN_WHALE,
	TOKENIZED_STOCKS,
	TOKENS,
} from "@/constants";
import { TAKER_SWAP_AMOUNT_IN } from "@/lib/swap";

export const robinhoodForkClient = createTestClient({
	account: maker,
	chain: robinhoodFork,
	mode: "anvil",
	transport: http(ROBINHOOD_FORK_RPC_URL),
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

const FAUCET_ETH = parseEther("1");

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
	usdgTransferHash: Hex;
	usdgAmount: string;
}> {
	await fundNativeEth(taker);

	const usdgTransferHash = await distributeInitialTokens({
		tokenSymbol: "USDG",
		recipient: taker,
		amount: TAKER_SWAP_AMOUNT_IN,
	});

	return {
		gasFunded: true,
		usdgTransferHash,
		usdgAmount: TAKER_SWAP_AMOUNT_IN.toString(),
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
