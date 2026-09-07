import {
	Address,
	AQUA_CONTRACT_ADDRESSES,
	AquaProtocolContract,
	HexString,
	NetworkEnum,
} from "@1inch/aqua-sdk";
import {
	AQUA_SWAP_VM_CONTRACT_ADDRESSES,
	AquaXYCAmmStrategy,
	MakerTraits,
	Order,
} from "@1inch/swap-vm-sdk";

import {
	createPublicClient,
	createTestClient,
	createWalletClient,
	encodeAbiParameters,
	erc20Abi,
	formatEther,
	formatUnits,
	getAddress,
	http,
	parseEther,
	parseUnits,
	publicActions,
	walletActions,
} from "viem";
import { privateKeyToAccount, privateKeyToAddress } from "viem/accounts";
import { robinhood } from "viem/chains";

import { TOKENS } from "@/constants";
import { distributeInitialTokens, logTokenBalances } from "@/lib/utils";

const aquaContractAddress = AQUA_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];
const aquaRegistry = new AquaProtocolContract(aquaContractAddress);
const swapVmRouter = AQUA_SWAP_VM_CONTRACT_ADDRESSES[NetworkEnum.ROBINHOOD];

// The user (= liquidity provider) will place 1,000$.
// It will pick "Conservative", it is going to ship as follow:
// - 50% = 500$ in USDG / WETH, so 250$ in USDG, 250$ in WETH

// Note: we assume for now a fixed rate of 1 ETH = 2,500$

// Impersonate this random address for now
const maker = "0x74fabbd2e02557dD31c1f7AEf193f95197C5c32C";

const usdgAmount = parseUnits("250", 6);
const wethAmount = parseEther("0.1");

// await logTokenBalances("before", maker);
await distributeInitialTokens("USDG", maker, usdgAmount);
await distributeInitialTokens("WETH", maker, wethAmount);
await logTokenBalances("after", maker);

const program = AquaXYCAmmStrategy.new().withFeeTokenIn(30).build();
const order = Order.new({
	maker: new Address(maker),
	program,
	traits: MakerTraits.default(),
});

// Ship your first strategy
const shipTx = aquaRegistry.ship({
	app: swapVmRouter,
	strategy: order.encode(),
	amountsAndTokens: [
		{
			token: new Address(TOKENS.USDG),
			amount: usdgAmount, // USDG has 6 decimals
		},
		{
			token: new Address(TOKENS.WETH),
			amount: wethAmount,
		},
	],
});

console.log("Ship tx: ", shipTx);

// connect to anvil fork running for Robinhood
const testClient = createTestClient({
	chain: robinhood,
	mode: "anvil", // Or 'hardhat' depending on your node
	transport: http("http://127.0.0.1:8545"),
})
	.extend(publicActions)
	.extend(walletActions);

// (Optional) Fund with ETH to pay for transaction gas fees
await testClient.impersonateAccount({ address: maker });

// Send transaction
const wallet = createWalletClient({
	chain: robinhood,
	transport: http("http://127.0.0.1:8545"),
	account: maker,
});

const aqua = aquaContractAddress.toString() as `0x${string}`;

await wallet.writeContract({
	address: TOKENS.USDG,
	abi: erc20Abi,
	functionName: "approve",
	args: [aqua, usdgAmount],
	account: maker,
});
await wallet.writeContract({
	address: TOKENS.WETH,
	abi: erc20Abi,
	functionName: "approve",
	args: [aqua, wethAmount],
	account: maker,
});

// TODO: try to run it with `testClient` instead?
const result = await wallet.sendTransaction(shipTx);
console.log("Result: ", result);
