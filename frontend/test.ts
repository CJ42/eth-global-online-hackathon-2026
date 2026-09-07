import { AquaProtocolContract, HexString, NetworkEnum } from "@1inch/aqua-sdk"
import { AquaProgramBuilder, Order } from "@1inch/swap-vm-sdk"

const _1INCH_API_KEY = "0Z2cepkGHpzPxbGsuv2x71NVpSzqmkOS"
const ROBINHOOD_CHAIN_ID = NetworkEnum.ROBINHOOD
const PAGE_SIZE = 100

interface StrategyToken {
  address: `0x${string}`
  balance: {
    strategy: string
    wallet: string
  }
  allowance: string
}

interface OpenedStrategy {
  chainId: number
  maker: `0x${string}`
  app: `0x${string}`
  strategyHash: `0x${string}`
  strategyBytes: `0x${string}` | null
  strategyBytesOmittedReason: string | null
  openedAt: number
  tokens: StrategyToken[]
}

interface OpenedStrategiesResponse {
  items: OpenedStrategy[]
  total: number
  nextCursor: string | null
}

async function fetchOpenedPage(cursor?: string) {
  const url = new URL("https://api.1inch.com/aqua/v1.0/strategies/opened")
  url.searchParams.set("chainIds", String(ROBINHOOD_CHAIN_ID))
  url.searchParams.set("limit", String(PAGE_SIZE))
  if (cursor)
    url.searchParams.set("cursor", cursor)

  const response = await fetch(url, {
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${_1INCH_API_KEY}`,
    },
  })

  if (!response.ok)
    throw new Error(`Aqua API ${response.status}: ${await response.text()}`)

  return response.json() as Promise<OpenedStrategiesResponse>
}

async function fetchAllOpenedStrategies() {
  const items: OpenedStrategy[] = []
  let cursor: string | undefined

  while (true) {
    const page = await fetchOpenedPage(cursor)
    items.push(...page.items)
    if (!page.nextCursor)
      return items
    cursor = page.nextCursor
  }
}

function decodeStrategy(item: OpenedStrategy) {
  if (!item.strategyBytes)
    return {
      strategyHash: item.strategyHash,
      error: item.strategyBytesOmittedReason ?? "missing strategyBytes",
    }

  const strategy = new HexString(item.strategyBytes)
  const order = Order.decode(strategy)
  const program = AquaProgramBuilder.decode(order.program)

  return {
    chainId: item.chainId,
    maker: item.maker,
    app: item.app,
    strategyHash: item.strategyHash,
    computedHash: AquaProtocolContract.calculateStrategyHash(strategy).toString(),
    openedAt: item.openedAt,
    tokens: item.tokens,
    order: {
      maker: order.maker.toString(),
      useAquaInsteadOfSignature: order.traits.useAquaInsteadOfSignature,
      program: order.program.toString(),
      instructions: program.getInstructions().map((ix) => ix.toJSON()),
    },
  }
}

const strategies = await fetchAllOpenedStrategies()
const decoded = strategies.map((item) => {
  try {
    return decodeStrategy(item)
  } catch (error) {
    return {
      strategyHash: item.strategyHash,
      error: error instanceof Error ? error.message : String(error),
    }
  }
})

const outputPath = new URL("./robinhood-strategies.json", import.meta.url)
const payload = { chainId: ROBINHOOD_CHAIN_ID, total: strategies.length, decoded }

await Bun.write(outputPath, `${JSON.stringify(payload, null, 2)}\n`)
console.log(`Wrote ${strategies.length} strategies to ${outputPath.pathname}`)
