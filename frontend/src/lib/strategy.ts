import { Address, AquaProtocolContract, type CallInfo } from "@1inch/aqua-sdk";
import { AquaXYCAmmStrategy, MakerTraits, Order } from "@1inch/swap-vm-sdk";
import {
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

export interface AquaStrategyInput {
	maker: `0x${string}`;
	walletClient: WalletClient;
	liquidityProvision: LiquidityProvision;
}

export interface ShippedStrategy {
	sleeve: PairAllocation["sleeve"];
	hash: Hex;
	receipt: TransactionReceipt;
}

export async function buildAquaStrategy({
	maker,
	walletClient,
	liquidityProvision,
}: AquaStrategyInput): Promise<CallInfo> {
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

	return aquaRegistry.ship({
		app: SWAP_VM_ROUTER,
		strategy: order.encode(),
		amountsAndTokens: liquidityProvision,
	});
}

/**
 *
 * @dev approve tokens part of the strategy + ship strategy to Aqua registry
 *
 * @param param0
 * @returns Three tx hashes:
 * - two for the token approvals to Aqua
 * - one for the tx to ship to Aqua
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

	// We could have made a `for` loop, but since there is only two liquidity pairs
	// Make it explicitly readable for hackthon judges

	// Token0
	const addressToken0 = liquidityProvision[0].token.toString();
	const amountToken0 = liquidityProvision[0].amount;

	// Token0
	const addressToken1 = liquidityProvision[1].token.toString();
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

	const approvalHashes: [Hex, Hex] = [
		approvalTxHashToken0,
		approvalTxHashToken1,
	];

	const shipTx = await buildAquaStrategy({
		maker: account.address,
		walletClient,
		liquidityProvision: toLiquidityProvision(allocation),
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
		approvalHashes,
		shipped: {
			sleeve: allocation.sleeve,
			hash,
			receipt,
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

export interface ShipAquaPortfolioInput {
	walletClient: WalletClient;
	allocations: PairAllocation[];
}

export interface ShipAquaPortfolioResult {
	approvalHashes: Hex[];
	shipped: ShippedStrategy[];
}

export async function shipAquaPortfolio({
	walletClient,
	allocations,
}: ShipAquaPortfolioInput): Promise<ShipAquaPortfolioResult> {
	const approvalHashes: Hex[] = [];
	const shipped: ShippedStrategy[] = [];

	allocations.map(async (allocation) => {
		const result = await shipAquaStrategy({
			walletClient,
			allocation,
		});
		approvalHashes.push(...result.approvalHashes);
		shipped.push(result.shipped);
	});

	return {
		approvalHashes,
		shipped,
	};
}
