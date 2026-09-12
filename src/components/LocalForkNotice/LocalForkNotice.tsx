"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LOCAL_FORK_RPC_URL } from "@/config";
import styles from "./LocalForkNotice.module.css";

const CHAIN_START_COMMAND = "anvil --fork-url https://rpc.mainnet.chain.robinhood.com --chain-id 7357171 --gas-limit 30000000 --state robinhood-fork-state.json --state-interval 60";

export function LocalForkNotice() {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		await navigator.clipboard.writeText(CHAIN_START_COMMAND);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	}

	return (
		<aside className={styles.notice} aria-labelledby="local-fork-title">
			<p className={styles.eyebrow}>Before you start</p>
			<h2 id="local-fork-title" className={styles.title}>
				Run a local Robinhood fork
			</h2>
			<p className={styles.body}>
				Deploys and swaps talk to an Anvil fork of Robinhood mainnet, not the
				public chain. Keep that fork on your machine so demo transactions stay
				local. The app uses the hosted RPC first, then falls back to{" "}
				<code>{LOCAL_FORK_RPC_URL}</code>.
			</p>
			<div className={styles.commandRow}>
				<pre className={styles.command}>
					<code>{CHAIN_START_COMMAND}</code>
				</pre>
				<Button
					type="button"
					variant="outline"
					className={styles.copy}
					onClick={handleCopy}
				>
					{copied ? "Copied" : "Copy"}
				</Button>
			</div>
		</aside>
	);
}
