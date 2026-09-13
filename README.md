# Aqua Funds Manager - Submission for Eth Global Online Hackathon 2026

> - **Project name:** 💧 Aqua Funds Manager
> - **🔗 Live Demo URL:** [https://eth-global-online-hackathon-2026.cavallerajean.workers.dev/](https://eth-global-online-hackathon-2026.cavallerajean.workers.dev/)


## Project Overview

An Aqua App that allows a liquidity provider to manage its positions and liquidity allocations using Swap VM opcodes programs.

The integration with 1inch is built in a way to re-balance funds liquidity between different portfolio management strategies.

**Tech Stack:**
- ⚒️ 1inch Aqua + Swap VM SDK, from [`@1inch/aqua-sdk`](https://github.com/1inch/sdks/tree/master/typescript/aqua) and [`@1inch/aqua-swap-vm`](https://github.com/1inch/sdks/tree/master/typescript/swap-vm)
- ⛓️ anvil fork of Robinhood mainnet running locally via a chain state snapshot
- 💻 Next.js for the UI

### Liquidity profiles

3 investment risk profiles can be used on Robinhood network:
- **Conservative**
- **Balanced**
- **Aggressive**

| Sleeve    | Pair (Robinhood)   | Conservative | Balanced | Aggressive |
|-----------|----------------------------|--------------|----------|------------|
| Low risk  | USDG / WETH        | 50%          | 25%      | 20%        |
| Medium risk  | WETH / 1INCH       | 30%          | 50%      | 30%        |
| High risk | USDG / TSLA | 20%          | 25%      | 50%        |

## User Flow Example

### For the liquidity provider

A user (= liquidity provider) has 1,000$ to invest.

The flow for the user will be as follow (after connecting to the Robinhood network with its wallet).

1. The user picks one of the following pre-built portfolio strategy: **Conservative**, **Balanced**, or **Aggressive**. 

Each portfolio strategy has different risk profile. Depending on the risk profile selected, the aqua strategies will be shipped differently with different amounts (the 1,000$ will be split differently acrossing the three liquidity pools).

Let's consider the user picks the ✅ **Conservative** strategy.

2. The user clicks on **Deploy strategies**, and get prompted to approve USDG + WETH + TSLA tokenized stock to the Aqua protocol contract.
3. The user then ship the three Aqua XYC strategies.
4. The dashboard shows those 3 strategy hashes.

```
Maker wallet                    Aqua registry                 SwapVM router
(tokens live here)              (virtual balances)            (AMM program)
      │                                │                            │
      │  approve USDG + WETH           │                            │
      │───────────────────────────────►│                            │
      │  ship(app, strategy, amounts)  │                            │
      │───────────────────────────────►│  “app = this router”       │
      │                                │───────────────────────────►│
```

👨🏻‍💻 **Key code pointers:**
- Ship + encoded strategy: [`src/lib/strategy.ts`](src/lib/strategy.ts), [`src/app/api/ship/route.ts`](src/app/api/ship/route.ts)
- Taker fund: [`src/app/api/taker/fund/route.ts`](src/app/api/taker/fund/route.ts), [`src/app/api/fork.ts`](src/app/api/fork.ts)

### Trader flow

After connecting its wallet to the app and using the Robinhood anvil fork network (chain ID `1337`, RPC `http://localhost:8545`), a taker can go to the page **For Traders** to perform a swap.

1. The trader click on the button to **swap 10 USDG**:
   - backend funds the connected address with gas + 10 USDG (`POST /api/taker/fund`)
   - MetaMask signs USDG approve → AquaSwapVMRouter
   - MetaMask signs SwapVM `swap()` against the low-risk USDG/WETH strategy
2. UI shows swap tx hash, `Swapped` / `Pulled` / `Pushed`, and ERC-20 `Transfer` evidence.


👨🏻‍💻 **Key code pointers:**
- Quote / swap / receipt decode: [`src/lib/swap.ts`](src/lib/swap.ts)
- MetaMask UI: [`src/feature/TakerSwap/TakerSwapPanel.tsx`](src/feature/TakerSwap/TakerSwapPanel.tsx)


## Pre-requisites

**Required for judges:** 

1. Download the [`robinhood-chan-snapshot.json`](./robinhood-fork-snapshot.json) file to have the Robinhood mainnet state snapshot (run the fork locally.
2. run a local Anvil chain before using the app. Demo transactions stay on your machine instead of public Robinhood.

- RPC: `http://localhost:8545`
- Chain ID: `1337`

```bash
bun run chain:start
```

3. Then add **Robinhood Anvil Fork** in your wallet (`1337`, RPC `http://localhost:8545`).

### Why a snapshot instead of a live fork

`chain:start` loads [`robinhood-fork-snapshot.json`](robinhood-fork-snapshot.json), a state dump of a Robinhood mainnet fork that already contains the real Aqua registry, AquaSwapVMRouter, USDG / WETH / 1INCH / TSLA contracts and their whale balances. It runs standalone, with no upstream RPC.

The public Robinhood RPC (`rpc.mainnet.chain.robinhood.com`) only serves state for roughly the last 10 minutes of blocks (block time is ~100 ms). A live `anvil --fork-url` pinned to an older block cannot load any account it has not already cached, making `ship()` and `swap()` operations hang with `metadata is not found` in the Anvil log. 

Using a snapshot, the chain cannot go stale.

To rebuild the snapshot from current mainnet state:

```bash
bun run chain:fork       # terminal 1: fresh live fork (valid ~10 minutes)
bun run chain:snapshot   # terminal 2: warms the demo flow, writes robinhood-fork-snapshot.json
```

Then stop `chain:fork` and use `chain:start`.

---

## Local Development Getting Started

1. install dependencies

```bash
bun install
```

2. Start a local chain fork of Robinhood mainnet (Anvil on `http://localhost:8545`, chain id `1337`)

```bash
bun run chain:start
```

<!-- > **Note:** keep the `--gas-limit 30000000` flag when starting anvil (locally or on the VPS). Robinhood has a 2^50 block gas limit, while anvil ≥ 1.8 uses it as the default `gas` for `eth_sendTransaction`, so impersonated accounts fail with "Insufficient funds for gas * price + value". The fork client also estimates gas explicitly (see [`src/lib/anvilTransport.ts`](src/lib/anvilTransport.ts)) as a second safeguard. -->

3. Run UI website locally

```bash
bun run dev
```

## References

- https://github.com/1inch/swap-vm/blob/main/docs/PROGRAMS.md
- https://github.com/1inch/swap-vm/tree/main
- https://github.com/1inch/aqua
- https://github.com/1inch/sdks/tree/master/typescript/aqua
- https://developers.uniswap.org/docs
- https://developers.uniswap.org/dashboard/welcome
- https://developers.uniswap.org/hackathon-feedback
- https://github.com/Uniswap/uniswap-ai
- (optional) see if code in this template can be re-used: https://github.com/1inch/aqua-app-template/blob/main/test/XYCSwap.test.ts
