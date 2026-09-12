"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AddRobinhoodNetworkButton } from "@/components/ForkWalletActions";
import styles from "./LocalForkNotice.module.css";

const CHAIN_START_COMMAND = `anvil --fork-url https://rpc.mainnet.chain.robinhood.com --chain-id 1337 --gas-limit 30000000 --state robinhood-fork-state.json --state-interval 60`;

export function LocalForkNotice() {
	const [copied, setCopied] = useState(false);

	async function handleCopy() {
		await navigator.clipboard.writeText(CHAIN_START_COMMAND);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1500);
	}

	return (
		<aside className={styles.notice} aria-labelledby="local-fork-title">
			<h2 id="local-fork-title" className={styles.title}>
				Step 1 - Run a local Robinhood fork
			</h2>
			<p>
				To test this app, run a local fork of Robinhood mainnet via <code>anvil</code>.
			</p>
			<ol>
				<li>1) Install <code>Foundry</code> to have <code>anvil</code></li>
				<li>2) Open your terminal and run the following command</li>
			</ol>
			<p>
			Keep it running on your machine so demo transactions stay
			local.
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
			<div className={styles.networkAction}>
				<AddRobinhoodNetworkButton />
			</div>
		</aside>
	);
}
