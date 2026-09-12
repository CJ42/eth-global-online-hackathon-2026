import { LocalForkNotice } from "@/components/LocalForkNotice";
import { PageShell } from "@/components/PageShell";
import { ShipStrategy } from "@/feature/ShipStrategy";

export default function HomePage() {
	return (
		<PageShell
			eyebrow="Aqua Portfolio"
			title="Pre-built investment and rebalancing strategies adapted to your tolerance to risk"
			subtitle="Choose how your liquidity is allocated across stable assets, crypto, and tokenized stocks."
		>
			<LocalForkNotice />
			<ShipStrategy />
		</PageShell>
	);
}
