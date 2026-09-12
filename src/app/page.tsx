import { ClaimTestFunds } from "@/components/ClaimTestFunds";
import { LocalForkNotice } from "@/components/LocalForkNotice";
import { PageShell } from "@/components/PageShell";
import { ShipStrategy } from "@/feature/ShipStrategy";
import styles from "./page.module.css";

export default function HomePage() {
	return (
		<PageShell
			eyebrow="Aqua Portfolio"
			title="Pre-built investment and rebalancing strategies adapted to your tolerance to risk"
			subtitle="Choose how your liquidity is allocated across stable assets, crypto, and tokenized stocks."
		>
			<h1 className="text-2xl font-bold">Before you start</h1>
			<div className={styles.setup}>
				<LocalForkNotice />
				<ClaimTestFunds />
			</div>
			<ShipStrategy />
		</PageShell>
	);
}
