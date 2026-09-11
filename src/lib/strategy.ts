import { Address, AquaProtocolContract, type CallInfo } from "@1inch/aqua-sdk";
import { AquaXYCAmmStrategy, MakerTraits, Order } from "@1inch/swap-vm-sdk";
import {
	type Address as EvmAddress,
	encodeAbiParameters,
	type Hex,
	hexToBigInt,
	keccak256,
	type TransactionReceipt,
	type WalletClient,
} from "viem";
import { getTransactionCount, waitForTransactionReceipt } from "viem/actions";
import { AQUA_CONTRACT, SWAP_VM_ROUTER } from "@/config";
import type { PairAllocation } from "./portfolio";
import { approveAquaToSpendTokens } from "./tokens";

export type LiquidityProvision = [
	{
		token: Address;
		amount: bigint;
	},
	{
		token: Address;
		amount: bigint;
	},
];

export type AquaStrategyInput = {
	maker: `0x${string}`;
	walletClient: WalletClient;
	liquidityProvision: LiquidityProvision;
};

export type BuiltAquaStrategy = {
	shipTx: CallInfo;
	strategy: Hex;
};

export type ShippedStrategy = {
	sleeve: PairAllocation["sleeve"];
	hash: Hex;
	receipt: TransactionReceipt;
	strategy: Hex;
};

export async function buildAquaStrategy({
	maker,
	walletClient,
	liquidityProvision,
}: AquaStrategyInput): Promise<BuiltAquaStrategy> {
	const aquaRegistry = new AquaProtocolContract(AQUA_CONTRACT);
	const makerNonce = await getTransactionCount(walletClient, {
		address: maker,
		blockTag: "latest",
	});
	const salt = generateAquaStrategySalt({ liquidityProvision, makerNonce });

	const program = AquaXYCAmmStrategy.new()
		.withFeeTokenIn(30)
		.withSalt(salt)
		.build();

	const order = Order.new({
		maker: new Address(maker),
		program,
		traits: MakerTraits.default(),
	});

	const strategy = order.encode().toString() as Hex;

	return {
		shipTx: aquaRegistry.ship({
			app: SWAP_VM_ROUTER,
			strategy: order.encode(),
			amountsAndTokens: liquidityProvision,
		}),
		strategy,
	};
}

/**
 * Approve both legs of an allocation, then ship that strategy to Aqua.
 */
export async function shipAquaStrategy({
	walletClient,
	allocation,
}: {
	walletClient: WalletClient;
	allocation: PairAllocation;
}): Promise<{ approvalHashes: Hex[]; shipped: ShippedStrategy }> {
	const account = walletClient.account;
	if (!account) throw new Error("walletClient account is required");

	const liquidityProvision = toLiquidityProvision(allocation);

	// Explicit for hackathon judges: each pair has exactly two tokens.
	const addressToken0 = liquidityProvision[0].token.toString() as EvmAddress;
	const amountToken0 = liquidityProvision[0].amount;
	const addressToken1 = liquidityProvision[1].token.toString() as EvmAddress;
	const amountToken1 = liquidityProvision[1].amount;

	const approvalTxHashToken0 = await approveAquaToSpendTokens({
		walletClient,
		token: addressToken0,
		amount: amountToken0,
	});
	await waitForTransactionReceipt(walletClient, { hash: approvalTxHashToken0 });

	const approvalTxHashToken1 = await approveAquaToSpendTokens({
		walletClient,
		token: addressToken1,
		amount: amountToken1,
	});
	await waitForTransactionReceipt(walletClient, { hash: approvalTxHashToken1 });

	const { shipTx, strategy } = await buildAquaStrategy({
		maker: account.address,
		walletClient,
		liquidityProvision,
	});

	const hash = await walletClient.sendTransaction({
		account,
		chain: walletClient.chain,
		to: shipTx.to as `0x${string}`,
		data: shipTx.data as Hex,
		value: shipTx.value,
	});

	const receipt = await waitForTransactionReceipt(walletClient, { hash });

	return {
		approvalHashes: [approvalTxHashToken0, approvalTxHashToken1],
		shipped: {
			sleeve: allocation.sleeve,
			hash,
			receipt,
			strategy,
		},
	};
}

export function generateAquaStrategySalt({
	liquidityProvision,
	makerNonce,
}: {
	liquidityProvision: LiquidityProvision;
	makerNonce: number;
}): bigint {
	const encoded = encodeAbiParameters(
		[
			{
				name: "liquidityProvision",
				type: "tuple[]",
				components: [
					{ name: "token", type: "address" },
					{ name: "amount", type: "uint256" },
				],
			},
			{ name: "makerNonce", type: "uint256" },
		],
		[
			liquidityProvision.map(({ token, amount }) => ({
				token: token.toString() as `0x${string}`,
				amount,
			})),
			BigInt(makerNonce),
		],
	);

	return BigInt.asUintN(64, hexToBigInt(keccak256(encoded)));
}

export function toLiquidityProvision(
	allocation: PairAllocation,
): LiquidityProvision {
	return [
		{
			token: new Address(allocation.legs[0].token.address),
			amount: allocation.legs[0].amount,
		},
		{
			token: new Address(allocation.legs[1].token.address),
			amount: allocation.legs[1].amount,
		},
	];
}

export type ShipAquaPortfolioInput = {
	walletClient: WalletClient;
	allocations: PairAllocation[];
};

export type ShipAquaPortfolioResult = {
	approvalHashes: Hex[];
	shipped: ShippedStrategy[];
};

export async function shipAquaPortfolio({
	walletClient,
	allocations,
}: ShipAquaPortfolioInput): Promise<ShipAquaPortfolioResult> {
	const approvalHashes: Hex[] = [];
	const shipped: ShippedStrategy[] = [];

	for (const allocation of allocations) {
		const result = await shipAquaStrategy({
			walletClient,
			allocation,
		});
		approvalHashes.push(...result.approvalHashes);
		shipped.push(result.shipped);
	}

	return {
		approvalHashes,
		shipped,
	};
}
