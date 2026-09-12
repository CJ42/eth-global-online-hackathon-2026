"use client";

import { AddRobinhoodNetworkButton } from "./AddRobinhoodNetworkButton";
import styles from "./ForkWalletActions.module.css";
import { ImportTokens } from "./ImportTokens";

export function ForkWalletActions() {
	return (
		<div className={styles.root}>
			<AddRobinhoodNetworkButton />
			<ImportTokens align="end" />
		</div>
	);
}
