"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	ensureRobinhoodNetwork,
	formatWalletError,
	getEthereumProvider,
} from "@/lib/wallet";
import styles from "./ForkWalletActions.module.css";

export function AddRobinhoodNetworkButton() {
	const [busy, setBusy] = useState(false);
	const [status, setStatus] = useState<string | null>(null);

	async function addNetwork() {
		if (busy) return;
		setBusy(true);
		setStatus(null);

		try {
			await ensureRobinhoodNetwork(getEthereumProvider());
			setStatus("Wallet is on Robinhood Anvil Fork.");
		} catch (error) {
			setStatus(formatWalletError(error, "Could not add the Robinhood fork."));
		} finally {
			setBusy(false);
		}
	}

	return (
		<div className={styles.networkWrap}>
			<Button
				type="button"
				className={styles.network}
				disabled={busy}
				onClick={addNetwork}
			>
				{busy ? "Adding…" : "Add Robinhood Fork"}
			</Button>
			{status ? (
				<p className={styles.status} role="status">
					{status}
				</p>
			) : null}
		</div>
	);
}
