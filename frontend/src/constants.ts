import type { Address } from "viem";

// List of tokenized stocks on Robinhood
export const TOKENIZED_STOCKS = {
	// Tesla
	TSLA: "0x322F0929c4625eD5bAd873c95208D54E1c003b2d",
	// NVIDIA
	NVDA: "0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC",
	// Apple
	AAPL: "0xaF3D76f1834A1d425780943C99Ea8A608f8a93f9",
	// Microsoft
	MSFT: "0xe93237C50D904957Cf27E7B1133b510C669c2e74",
	// Amazon
	AMZN: "0x12f190a9F9d7D37a250758b26824B97CE941bF54",
	// Alphabet
	GOOGL: "0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3",
	// Meta
	META: "0xc0D6457C16Cc70d6790Dd43521C899C87ce02f35",
	// Coinbase
	COIN: "0x6330D8C3178a418788dF01a47479c0ce7CCF450b",
	// GameStop
	GME: "0x1b0E319c6A659F002271B69dB8A7df2F911c153E",
	// SpaceX
	SPCX: "0x4a0E65A3EcceC6dBe60AE065F2e7bb85Fae35eEa",
	// S&P 500 ETF
	SPY: "0x117cc2133c37B721F49dE2A7a74833232B3B4C0C",
	// Nasdaq ETF
	QQQ: "0xD5f3879160bc7c32ebb4dC785F8a4F505888de68",
	// US Oil Fund
	USO: "0xa30FA36Db767ad9eD3f7a60fC79526fB4d56D344",
} as const satisfies Record<string, Address>;

export type AvailableTokenizedStocks = keyof typeof TOKENIZED_STOCKS;

// Token addresses on Robinhood
export type AvailableTokens = "WETH" | "USDG" | "ONEINCH";

export const TOKENS: Record<AvailableTokens, Address> = {
	WETH: "0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73",
	USDG: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
	ONEINCH: "0x1755c2910c126ee1b0cf1e08a307dc9e787285a0",
} as const;

// Token whales holding large amounts of tokens
// used for distributing tokens to maker / liquidity provider
// ----------------------------------------
export const TOKEN_WHALE = {
	// holds around 13 Millions USDG
	USDG: "0x1A18a8b96eac3F980133A18402d04194f1FAA4E7",
	WETH: "0xA379bedcc2A237cab1021cc2A4744edfB6C42618",
	ONEINCH: "0x481787bBa8C56f801Db8bdb336844b771c011246",
	TSLA: "0x2F4579Ca81717d3D61BF8b6f06571877Bbe54A07",
} as const satisfies Record<string, Address>;

export type AvailableWhaleTokens = keyof typeof TOKEN_WHALE;

export const TOKEN_ADDRESS_BY_SYMBOL = {
	...TOKENS,
	...TOKENIZED_STOCKS,
} as const;
