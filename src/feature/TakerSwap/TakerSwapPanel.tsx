"use client";

import { useState } from "react";
import {
	type Address,
	createPublicClient,
	createWalletClient,
	custom,
	erc20Abi,
	formatUnits,
	type Hex,
	http,
} from "viem";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { LOCALHOST_RPC_URL, robinhoodFork, SWAP_VM_ROUTER } from "@/config";
import {
	buildTakerQuoteTx,
	buildTakerSwapTx,
	type DecodedTakerSwap,
	decodeQuoteResult,
	decodeTakerSwapReceipt,
	TAKER_SWAP_AMOUNT_IN,
	TAKER_TOKEN_IN,
	type TakerSwapQuote,
} from "@/lib/swap";
import { type FundTakerResult, fundTaker, requestFaucet } from "./api";
import styles from "./TakerSwap.module.css";

type EthereumProvider = {
	request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

type TakerSwapPanelProps = {
	strategy: Hex;
	strategyHash: Hex | null;
};

type SwapResultView = {
	txHash: Hex;
	quote: TakerSwapQuote;
	decoded: DecodedTakerSwap;
};

declare global {
	interface Window {
		ethereum?: EthereumProvider;
	}
}

const FORK_CHAIN_ID_HEX = `0x${robinhoodFork.id.toString(16)}`;

export function TakerSwapPanel({
	strategy,
	strategyHash,
}: TakerSwapPanelProps) {
	const [taker, setTaker] = useState<Address | null>(null);
	const [funding, setFunding] = useState<FundTakerResult | null>(null);
	const [faucetOk, setFaucetOk] = useState(false);
	const [quote, setQuote] = useState<TakerSwapQuote | null>(null);
	const [result, setResult] = useState<SwapResultView | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [status, setStatus] = useState<string | null>(null);
	const [busyAction, setBusyAction] = useState<
		"connect" | "faucet" | "swap" | null
	>(null);

	const isBusy = busyAction !== null;

	async function handleConnect() {
		if (isBusy) return;

		setError(null);
		setBusyAction("connect");

		try {
			const provider = getEthereumProvider();
			await ensureRobinhoodNetwork(provider);

			setStatus("Connecting MetaMask…");
			const accounts = (await provider.request({
				method: "eth_requestAccounts",
			})) as string[];
			const account = accounts[0] as Address | undefined;
			if (!account) throw new Error("No MetaMask account selected");

			setTaker(account);
			setFunding(null);
			setFaucetOk(false);
			setQuote(null);
			setResult(null);
			setStatus(`Connected ${shorten(account)}`);
		} catch (connectError) {
			setStatus(null);
			setError(
				connectError instanceof Error
					? connectError.message
					: "Failed to connect wallet",
			);
		} finally {
			setBusyAction(null);
		}
	}

	async function handleFaucet() {
		if (isBusy) return;
		if (!taker) {
			setError("Connect a wallet first");
			return;
		}

		setError(null);
		setBusyAction("faucet");

		try {
			const provider = getEthereumProvider();
			await ensureRobinhoodNetwork(provider);

			setStatus("Sending 1 ETH from faucet…");
			await requestFaucet(taker);
			setFaucetOk(true);

			setStatus("Sending 10 USDG to the connected wallet…");
			const funded = await fundTaker(taker);
			setFunding(funded);

			setStatus(
				"Funded 1 ETH + 10 USDG. Check MetaMask balance, then run the swap.",
			);
		} catch (faucetError) {
			setStatus(null);
			setError(
				faucetError instanceof Error
					? faucetError.message
					: "Failed to fund wallet",
			);
		} finally {
			setBusyAction(null);
		}
	}

	async function handleSwap() {
		if (isBusy) return;
		if (!taker) {
			setError("Connect a wallet first");
			return;
		}

		setError(null);
		setResult(null);
		setBusyAction("swap");

		try {
			const provider = getEthereumProvider();
			await ensureRobinhoodNetwork(provider);

			const walletClient = createWalletClient({
				account: taker,
				chain: robinhoodFork,
				transport: custom(provider),
			});
			const publicClient = createPublicClient({
				chain: robinhoodFork,
				transport: http(LOCALHOST_RPC_URL),
			});

			setStatus("Quoting USDG → WETH against the low-risk strategy…");
			const quoteTx = buildTakerQuoteTx({ strategy });
			const simulation = await publicClient.call({
				account: taker,
				to: quoteTx.to,
				data: quoteTx.data,
			});
			if (!simulation.data) throw new Error("SwapVM quote returned empty data");

			const quoted = decodeQuoteResult(simulation.data);
			setQuote(quoted);

			setStatus("Approve USDG for the AquaSwapVMRouter in MetaMask…");
			const approveHash = await walletClient.writeContract({
				address: TAKER_TOKEN_IN,
				abi: erc20Abi,
				functionName: "approve",
				args: [SWAP_VM_ROUTER.toString() as Address, TAKER_SWAP_AMOUNT_IN],
				account: taker,
				chain: robinhoodFork,
			});
			await publicClient.waitForTransactionReceipt({ hash: approveHash });

			setStatus("Confirm the SwapVM swap in MetaMask…");
			const swapTx = buildTakerSwapTx({
				strategy,
				minAmountOut: quoted.minAmountOut,
			});
			const swapHash = await walletClient.sendTransaction({
				account: taker,
				chain: robinhoodFork,
				to: swapTx.to,
				data: swapTx.data,
				value: swapTx.value,
			});
			const receipt = await publicClient.waitForTransactionReceipt({
				hash: swapHash,
			});

			const decoded = decodeTakerSwapReceipt(receipt);
			setResult({
				txHash: swapHash,
				quote: quoted,
				decoded,
			});
			setStatus(null);
		} catch (swapError) {
			setStatus(null);
			setError(
				swapError instanceof Error
					? swapError.message
					: "Failed to execute taker swap",
			);
		} finally {
			setBusyAction(null);
		}
	}

	return (
		<Card className={styles.card}>
			<CardHeader>
				<CardTitle>Taker swap (1inch qualification)</CardTitle>
				<CardDescription>
					1) Connect MetaMask on the local fork. 2) Faucet ETH + 10 USDG to that
					wallet. 3) Approve and swap USDG → WETH against the shipped low-risk
					Aqua strategy.
				</CardDescription>
			</CardHeader>
			<CardContent className={styles.content}>
				<p>
					Amount in: <strong>10 USDG</strong>
				</p>
				{strategyHash ? (
					<p>
						Strategy hash{" "}
						<code title={strategyHash}>{shorten(strategyHash)}</code>
					</p>
				) : null}
				{taker ? (
					<p>
						Connected <code title={taker}>{shorten(taker)}</code>
					</p>
				) : (
					<p>Wallet not connected</p>
				)}
				{faucetOk ? <p>Faucet ETH sent</p> : null}
				{funding ? (
					<p>
						USDG funded{" "}
						<code title={funding.usdgTransferHash}>
							{shorten(funding.usdgTransferHash)}
						</code>
					</p>
				) : null}
				{quote ? (
					<p>
						Quoted out: {formatUnits(quote.amountOut, 18)} WETH (min{" "}
						{formatUnits(quote.minAmountOut, 18)})
					</p>
				) : null}

				{result ? (
					<div className={styles.result}>
						<p>
							Swap tx{" "}
							<code title={result.txHash}>{shorten(result.txHash)}</code>
						</p>
						{result.decoded.swapped ? (
							<p>{result.decoded.swapped.message}</p>
						) : null}
						<ul>
							{result.decoded.pulled.map((event) => (
								<li key={`pulled-${event.token}-${event.amount}`}>
									{event.message}
								</li>
							))}
							{result.decoded.pushed.map((event) => (
								<li key={`pushed-${event.token}-${event.amount}`}>
									{event.message}
								</li>
							))}
							{result.decoded.transfers.map((event) => (
								<li
									key={`${event.token}-${event.from}-${event.to}-${event.amount}`}
								>
									{event.message}
								</li>
							))}
						</ul>
					</div>
				) : null}

				{status ? (
					<p className={styles.progress} aria-live="polite">
						{status}
					</p>
				) : null}
				{error ? (
					<p className={styles.error} role="alert">
						{error}
					</p>
				) : null}
			</CardContent>
			<CardFooter>
				<div className={styles.actions}>
					<Button
						type="button"
						variant="outline"
						className={styles.secondaryButton}
						disabled={isBusy}
						onClick={handleConnect}
					>
						{busyAction === "connect" ? "Connecting…" : "1. Connect wallet"}
					</Button>
					<Button
						type="button"
						variant="outline"
						className={styles.secondaryButton}
						disabled={isBusy || !taker}
						onClick={handleFaucet}
					>
						{busyAction === "faucet" ? "Funding…" : "2. Get funds (faucet)"}
					</Button>
					<Button
						type="button"
						className={styles.button}
						disabled={isBusy || !taker}
						onClick={handleSwap}
					>
						{busyAction === "swap" ? "Swapping…" : "3. Swap 10 USDG"}
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}

function getEthereumProvider(): EthereumProvider {
	if (!window.ethereum)
		throw new Error("MetaMask is required. Install it and retry.");
	return window.ethereum;
}

async function ensureRobinhoodNetwork(provider: EthereumProvider) {
	const chainId = (await provider.request({ method: "eth_chainId" })) as string;
	// if (chainId.toLowerCase() === FORK_CHAIN_ID_HEX.toLowerCase()) return;

	try {
		await provider.request({
			method: "wallet_switchEthereumChain",
			params: [{ chainId: FORK_CHAIN_ID_HEX }],
		});
	} catch {
		await provider.request({
			method: "wallet_addEthereumChain",
			params: [
				{
					chainId: FORK_CHAIN_ID_HEX,
					chainName: "Robinhood Anvil Fork",
					nativeCurrency: {
						name: "Ether",
						symbol: "ETH",
						decimals: 18,
					},
					rpcUrls: [LOCALHOST_RPC_URL],
				},
			],
		});
	}
}

function shorten(value: string) {
	return `${value.slice(0, 10)}…${value.slice(-8)}`;
}
