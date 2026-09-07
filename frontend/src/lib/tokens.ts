import {
	type Account,
	type Address,
	erc20Abi,
	type Hex,
	type WalletClient,
} from "viem";
import { AQUA_CONTRACT } from "@/config";

const aquaContractAddress = AQUA_CONTRACT.toString() as Address;

export async function approveAquaToSpendTokens({
	walletClient,
	account,
	token,
	amount,
}: {
	walletClient: WalletClient;
	account: Account | Address;
	token: Address;
	amount: bigint;
}): Promise<Hex> {
	return walletClient.writeContract({
		address: token,
		abi: erc20Abi,
		functionName: "approve",
		args: [aquaContractAddress, amount],
		account,
		chain: walletClient.chain,
	});
}
