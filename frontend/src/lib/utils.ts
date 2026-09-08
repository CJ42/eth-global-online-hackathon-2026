import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import {
	type Address,
	createPublicClient,
	createTestClient,
	createWalletClient,
	erc20Abi,
	formatEther,
	formatUnits,
	http,
	parseEther,
} from "viem";
import { robinhood } from "viem/chains";

import {
	type AvailableWhaleTokens,
	TOKEN_ADDRESS_BY_SYMBOL,
	TOKEN_WHALE,
	TOKENIZED_STOCKS,
	TOKENS,
} from "@/constants";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export async function distributeInitialTokens(
	tokenSymbol: AvailableWhaleTokens,
	recipient: `0x${string}`,
	amount: bigint,
) {
	// connect to anvil fork running for Robinhood
	const testClient = createTestClient({
		chain: robinhood,
		mode: "anvil", // Or 'hardhat' depending on your node
		transport: http("http://127.0.0.1:8545"),
	});

	// Wallet client to send the transaction from the impersonated account
	const walletClient = createWalletClient({
		chain: robinhood,
		transport: http("http://127.0.0.1:8545"),
	});

	// Public client to read blockchain state/receipts
	const publicClient = createPublicClient({
		chain: robinhood,
		transport: http("http://127.0.0.1:8545"),
	});

	const tokenWhale = TOKEN_WHALE[tokenSymbol];
	const tokenAddress = TOKEN_ADDRESS_BY_SYMBOL[tokenSymbol];

	try {
		console.log(
			`Impersonating whale accounts: ${tokenWhale} (for ${tokenSymbol})...`,
		);

		// 3. Start Impersonating the Whale Account
		await testClient.impersonateAccount({
			address: tokenWhale,
		});

		// (Optional) Fund the whale with ETH to pay for transaction gas fees
		await testClient.setBalance({
			address: tokenWhale,
			value: parseEther("1"),
		});

		// 4. Distribute Tokens to Recipients
		console.log(`Sending ${tokenSymbol} tokens to ${recipient}...`);

		const hash = await walletClient.writeContract({
			address: tokenAddress,
			abi: erc20Abi,
			functionName: "transfer",
			args: [recipient, amount],
			account: tokenWhale, // Viem uses this address because it's impersonated
		});

		await publicClient.waitForTransactionReceipt({ hash });
		console.log(`Transaction successful: ${hash}`);

		// 5. Clean up by stopping impersonation
		await testClient.stopImpersonatingAccount({
			address: tokenWhale,
		});

		console.log("Distribution complete successfully!");
	} catch (error) {
		console.error("Error distributing tokens:", error);
	}
}

export async function logTokenBalances(label: string, maker: Address) {
	const publicClient = createPublicClient({
		chain: robinhood,
		transport: http("http://127.0.0.1:8545"),
	});

	const [usdgBalance, wethBalance, oneinchBalance, tslaBalance] =
		await Promise.all([
			publicClient.readContract({
				address: TOKENS.USDG,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [maker],
			}),
			publicClient.readContract({
				address: TOKENS.WETH,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [maker],
			}),
			publicClient.readContract({
				address: TOKENS.ONEINCH,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [maker],
			}),
			publicClient.readContract({
				address: TOKENIZED_STOCKS.TSLA,
				abi: erc20Abi,
				functionName: "balanceOf",
				args: [maker],
			}),
		]);

	console.log(`${label} USDG: ${formatUnits(usdgBalance, 6)}`);
	console.log(`${label} WETH: ${formatEther(wethBalance)}`);
	console.log(`${label} 1INCH: ${formatUnits(oneinchBalance, 18)}`);
	console.log(`${label} TSLA: ${formatUnits(tslaBalance, 18)}`);
}
