import { ForkWalletActions } from "@/components/ForkWalletActions";
import { PageShell } from "@/components/PageShell";
import { TraderDesk } from "@/feature/TraderDesk";

export default function TradersPage() {
	return (
		<PageShell
			eyebrow="For traders"
			title="Swap against Aqua liquidity"
			subtitle="Pick a shipped SwapVM route, then swap with your connected wallet."
			compact
			actions={<ForkWalletActions />}
		>
			<TraderDesk />
		</PageShell>
	);
}
