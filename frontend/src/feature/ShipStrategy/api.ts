import type { RiskProfile } from "@/lib/portfolio";
import type { ShipPortfolioResult } from "@/lib/ship";

export async function shipPortfolio(
	profile: RiskProfile,
): Promise<ShipPortfolioResult> {
	const response = await fetch("/api/ship", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ profile }),
	});

	const payload = (await response.json()) as
		| ShipPortfolioResult
		| { error?: string };

	if (!response.ok) {
		throw new Error(
			"error" in payload && payload.error
				? payload.error
				: "Failed to ship portfolio",
		);
	}

	return payload as ShipPortfolioResult;
}
