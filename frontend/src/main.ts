import {
	createTestClient,
	createWalletClient,
	encodeAbiParameters,
	http,
	parseEther,
	parseUnits,
} from "viem";
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
import { robinhood } from "viem/chains";

import {
	AquaProtocolContract,
	AQUA_CONTRACT_ADDRESSES,
	NetworkEnum,
	Address,
	HexString,
} from "@1inch/aqua-sdk";
import { AQUA_SWAP_VM_CONTRACT_ADDRESSES } from "@1inch/swap-vm-sdk";

import { WETH_TOKEN, USDG_TOKEN } from "@/constants";

const aquaContractAddress = AQUA_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];
const aquaRegistry = new AquaProtocolContract(aquaContractAddress);
const swapVmRouter = AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];

// The user (= liquidity provider) will place 1,000$.
// It will pick "Conservative", it is going to ship as follow:
// - 50% = 500$ in USDG / WETH, so 250$ in USDG, 250$ in WETH

// Note: we assume for now a fixed rate of 1 ETH = 2,500$

// TODO: replace by `process.env.MAKER_PRIVATE_KEY`
const makerPrivateKey =
	"0xcafecafecafecafecafecafecafecafecafecafecafecafecafecafecafecafe";
const maker = privateKeyToAddress(makerPrivateKey);

// Define strategy based on the smart contract app structure. Each Aqua app can have it's own strategy schema
const strategyData = {
	maker,
	token0: WETH_TOKEN,
	token1: USDG_TOKEN,
	feeBps: 0n,
	salt: "0x0000000000000000000000000000000000000000000000000000000000000001",
} as const;

// Encode strategy as bytes
const strategy = encodeAbiParameters(
	[
		{
			name: "strategy",
			type: "tuple",
			components: [
				{ name: "maker", type: "address" },
				{ name: "token0", type: "address" },
				{ name: "token1", type: "address" },
				{ name: "feeBps", type: "uint256" },
				{ name: "salt", type: "bytes32" },
			],
		},
	],
	[strategyData],
);

// Ship your first strategy
const shipTx = aquaRegistry.ship({
	app: swapVmRouter,
	strategy: new HexString(strategy),
	amountsAndTokens: [
		{
			token: new Address(USDG_TOKEN),
			amount: parseUnits("250", 6), // USDG has 6 decimals
		},
		{
			token: new Address(WETH_TOKEN),
			amount: parseEther("0.1"),
		},
	],
});

// connect to anvil fork running for Robinhood
const testClient = createTestClient({
	chain: robinhood,
	mode: "anvil", // Or 'hardhat' depending on your node
	transport: http("http://127.0.0.1:8545"),
});

// Send transaction
const wallet = createWalletClient({
	chain: robinhood,
	transport: http("http://127.0.0.1:8545"),
	account: privateKeyToAccount(makerPrivateKey),
});

await wallet.sendTransaction(shipTx);
