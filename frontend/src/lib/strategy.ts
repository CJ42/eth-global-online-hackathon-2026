import { Address, AquaProtocolContract, type CallInfo } from "@1inch/aqua-sdk";
import { AquaXYCAmmStrategy, MakerTraits, Order } from "@1inch/swap-vm-sdk";
import {
	type Account,
	encodeAbiParameters,
	type Hex,
	hexToBigInt,
	keccak256,
	type WalletClient,
} from "viem";
import { getTransactionCount } from "viem/actions";
import { AQUA_CONTRACT, SWAP_VM_ROUTER } from "@/config";
import type { PairAllocation, TokenApproval } from "./portfolio";
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

export interface BuildAquaStrategyInput {
	maker: `0x${string}`;
	walletClient: WalletClient;
	liquidityProvision: LiquidityProvision;
}

export interface ShipAquaPortfolioInput {
	maker: `0x${string}`;
	walletClient: WalletClient;
	allocations: PairAllocation[];
	approvals: TokenApproval[];
}

export interface ShippedStrategy {
	sleeve: PairAllocation["sleeve"];
	hash: Hex;
}

export interface ShipAquaPortfolioResult {
	approvalHashes: Hex[];
	shipped: ShippedStrategy[];
}

export async function buildAquaStrategy({
	maker,
	walletClient,
	liquidityProvision,
}: BuildAquaStrategyInput): Promise<CallInfo> {
	const aquaRegistry = new AquaProtocolContract(AQUA_CONTRACT);
	const makerNonce = await getTransactionCount(walletClient, {
		address: maker,
		blockTag: "latest",
	});
	const salt = buildAquaStrategySalt({ liquidityProvision, makerNonce });

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

export function buildAquaStrategySalt({
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

export async function shipAquaPortfolio({
	maker,
	walletClient,
	allocations,
	approvals,
}: ShipAquaPortfolioInput): Promise<ShipAquaPortfolioResult> {
	const account = resolveAccount({ walletClient, maker });
	const approvalHashes: Hex[] = [];

	for (const approval of approvals) {
		const hash = await approveAquaToSpendTokens({
			walletClient,
			account,
			token: approval.token.address,
			amount: approval.amount,
		});
		approvalHashes.push(hash);
	}

	const shipped: ShippedStrategy[] = [];

	for (const allocation of allocations) {
		const shipTx = await buildAquaStrategy({
			maker,
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

		shipped.push({
			sleeve: allocation.sleeve,
			hash,
		});
	}

	return {
		approvalHashes,
		shipped,
	};
}

function resolveAccount({
	walletClient,
	maker,
}: {
	walletClient: WalletClient;
	maker: `0x${string}`;
}): Account | `0x${string}` {
	if (walletClient.account) return walletClient.account;
	return maker;
}
