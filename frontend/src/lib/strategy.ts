import { AQUA_CONTRACT, maker, SWAP_VM_ROUTER } from "@/config";
import { TOKENS } from "@/constants";
import { Address, AquaProtocolContract, CallInfo } from "@1inch/aqua-sdk";
import { AquaXYCAmmStrategy, MakerTraits, Order } from "@1inch/swap-vm-sdk";
import { Hex } from "viem";

export type LiquidityProvision = [
  {
    token: Address,
    amount: bigint
  },
  {
    token: Address,
    amount: bigint
  },
]

export function buildAquaStrategy(liquidityProvision: LiquidityProvision): CallInfo {
  const aquaRegistry = new AquaProtocolContract(AQUA_CONTRACT);

  const program = AquaXYCAmmStrategy.new().withFeeTokenIn(30).build();
  const order = Order.new({
    maker: new Address(maker),
    program,
    traits: MakerTraits.default(),
  });

  const shipTx = aquaRegistry.ship({
    app: SWAP_VM_ROUTER,
    strategy: order.encode(),
    amountsAndTokens: liquidityProvision,
  });

  return shipTx;
}