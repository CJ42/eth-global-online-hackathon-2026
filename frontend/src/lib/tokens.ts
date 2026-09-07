import {
  wallet,
  AQUA_CONTRACT
} from "@/config";

import { erc20Abi } from "viem"

const aquaContractAddress = AQUA_CONTRACT.toString() as `0x${string}`;

export async function approveAquaToSpendTokens(token: `0x${string}`, amount: bigint) {
  await wallet.writeContract({
    address: token,
	  abi: erc20Abi,
	  functionName: "approve",
	  args: [aquaContractAddress, amount],
	  account: wallet.account.address,
  })
}