import { AquaProtocolContract, HexString } from "@1inch/aqua-sdk"
import {
	type Address,
	createWalletClient,
	custom,
	fallback,
	type Hex,
	http,
	publicActions,
} from "viem"
import { LOCAL_FORK_RPC_URL, robinhoodFork } from "@/config"
import { TOKENIZED_STOCKS, TOKENS } from "@/constants"
import {
	buildPortfolioAllocations,
	computeSleeveDrift,
	FIXED_TOKEN_PRICES_USD,
	PROFILE_WEIGHTS,
	type SleeveId,
	type TokenPricesUsd,
} from "@/lib/portfolio"
import {
	decodeAquaShipEvents,
	type ShipPortfolioResult,
	type ShippedSleeveResult,
	strategyHashFromEvents,
} from "@/lib/ship"
import { saveShippedPortfolio } from "@/lib/ship-store"
import { type DockTarget, unship } from "@/lib/strategy"
import { ensureRobinhoodNetwork, getEthereumProvider } from "@/lib/wallet"

const SLEEVE_TOKENS: Record<SleeveId, [Address, Address]> = {
	low: [TOKENS.USDG, TOKENS.WETH],
	medium: [TOKENS.WETH, TOKENS.ONEINCH],
	high: [TOKENS.USDG, TOKENIZED_STOCKS.TSLA],
}

export interface RebalancePortfolioInput {
	currentResult: ShipPortfolioResult
	address: Address
	prices: TokenPricesUsd
	onStep?: (message: string) => void
}

export async function rebalancePortfolio({
	currentResult,
	address,
	prices,
	onStep,
}: RebalancePortfolioInput): Promise<ShipPortfolioResult> {
	const provider = getEthereumProvider()
	onStep?.("Switching wallet to the Robinhood fork…")
	await ensureRobinhoodNetwork(provider)

	const walletClient = createWalletClient({
		account: address,
		chain: robinhoodFork,
		transport: fallback([custom(provider), http(LOCAL_FORK_RPC_URL)]),
	}).extend(publicActions)

	const weights = PROFILE_WEIGHTS[currentResult.profile]
	const shipPrices = currentResult.prices ?? FIXED_TOKEN_PRICES_USD

	const { allocations: priorAllocations } = buildPortfolioAllocations({
		totalUsd: currentResult.totalUsd,
		weights,
		prices: shipPrices,
	})

	const driftResult = computeSleeveDrift({
		allocations: priorAllocations,
		prices,
		weights,
	})

	const newTotalUsd = driftResult.totalCurrentUsd

	const { allocations: newAllocations } = buildPortfolioAllocations({
		totalUsd: newTotalUsd,
		weights,
		prices,
	})

	const dockTargets: DockTarget[] = currentResult.sleeves.map((sleeve) => {
		const hash =
			sleeve.strategyHash ??
			(AquaProtocolContract.calculateStrategyHash(
				new HexString(sleeve.strategy),
			).toString() as Hex)

		return {
			sleeve: sleeve.sleeve,
			strategyHash: hash,
			tokens: SLEEVE_TOKENS[sleeve.sleeve],
		}
	})

	const unshipResult = await unship({
		walletClient,
		dockTargets,
		allocations: newAllocations,
		onStep,
	})

	const newSleeves: ShippedSleeveResult[] = unshipResult.shipped.map(
		(shipped) => {
			const events = decodeAquaShipEvents(shipped.receipt)
			return {
				sleeve: shipped.sleeve,
				txHash: shipped.hash,
				strategyHash: strategyHashFromEvents(events),
				strategy: shipped.strategy,
				events,
			}
		},
	)

	const updatedResult: ShipPortfolioResult = {
		profile: currentResult.profile,
		totalUsd: newTotalUsd,
		approvalHashes: unshipResult.approvalHashes,
		dockHashes: unshipResult.dockHashes,
		sleeves: newSleeves,
		prices,
	}

	saveShippedPortfolio(updatedResult)
	return updatedResult
}
