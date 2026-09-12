import { PageShell } from "@/components/PageShell";
import { InvestorDashboard } from "@/feature/InvestorDashboard";

export default function InvestorsPage() {
	return (
		<PageShell
			eyebrow="For investors"
			title="Your positions and amounts"
			subtitle="See how your last deployed portfolio is split across the three Aqua liquidity sleeves."
			compact
		>
			<InvestorDashboard />
		</PageShell>
	);
}
