# Aqua Funds Manager - Submission for Eth Global Online Hackathon 2026

> **Project name:** 💧 Aqua Funds Manager
> **🔗 Live Demo URL:** https://eth-global-online-hackathon-2026.cavallerajean.workers.dev/


## Project Overview

An Aqua App that allows a liquidity provider to manage its positions and liquidity allocations using Swap VM opcodes programs.

The integration with 1inch is built in a way to re-balance funds liquidity between different portfolio management strategies.

**Stack used:**
- 1inch Aqua + Swap VM SDK
- anvil fork of Robinhood chain running on self hosted VPS, exposed via Cloudflare tunnel

### Liquidity profiles

3 investment risk profiles can be used on Robinhood network:
- **Conservative**
- **Balanced**
- **Aggressive**

| Sleeve    | Pair (Robinhood)   | Conservative | Balanced | Aggressive |
|-----------|----------------------------|--------------|----------|------------|
| Low risk  | USDG / WETH        | 50%          | 25%      | 20%        |
| Medium risk  | WETH / 1INCH       | 30%          | 50%      | 30%        |
| High risk | USDG / one stock (e.g: TSLA) | 20%          | 25%      | 50%        |

## Example

A user (= liquidity provider) has 1,000$ to invest.

The user picks one of the following profile (Conservative, Balanced, or Aggressive). 

Depending on the profile selected, the aqua strategies will be shipped differently with different amounts.

Let's consider the user picks **Conservative**

1. Approve USDG + WETH + stock to Aqua.
2. ship three strategies with virtual balances ≈ $500 / $300 / $200.
3. The dashboard shows those 3 strategyHashes.

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


## Pre-requisites

This project runs as a fork of Robinhood on anvil. Run one using the following command below at step 2.


## Getting Started

1. install dependencies

```bash
bun install
```

2. Start a local chain fork of Robinhood chain (Anvil Robinhood fork on `http://127.0.0.1:8545`, chain id `4663`)

```bash
bun run chain:start
```

3. Run UI website locally

```bash
bun run dev
```

## Demo user flow

MetaMask → add network Robinhood Anvil Fork (`4663`, RPC `http://127.0.0.1:8545`)

Flow:
1. Select a risk profile → **Deploy strategies** (`POST /api/ship` ships three Aqua XYC strategies; maker inventory is auto-funded).
2. After ship succeeds, the **Taker swap** panel appears.
3. Click **Connect MetaMask & swap 10 USDG**:
   - backend funds the connected address with gas + 10 USDG (`POST /api/taker/fund`)
   - MetaMask signs USDG approve → AquaSwapVMRouter
   - MetaMask signs SwapVM `swap()` against the low-risk USDG/WETH strategy
4. UI shows swap tx hash, `Swapped` / `Pulled` / `Pushed`, and ERC-20 `Transfer` evidence.

Offline smoke (no MetaMask): `bun run smoke:taker-swap`

Key code pointers:
- Ship + encoded strategy: [`src/lib/strategy.ts`](src/lib/strategy.ts), [`src/app/api/ship/route.ts`](src/app/api/ship/route.ts)
- Taker fund: [`src/app/api/taker/fund/route.ts`](src/app/api/taker/fund/route.ts), [`src/app/api/fork.ts`](src/app/api/fork.ts)
- Quote / swap / receipt decode: [`src/lib/swap.ts`](src/lib/swap.ts)
- MetaMask UI: [`src/feature/TakerSwap/TakerSwapPanel.tsx`](src/feature/TakerSwap/TakerSwapPanel.tsx)

# ☑️ Implementation List (roadmap)

| Planned                                 | Status                       |
| --------------------------------------- | ---------------------------- |
| ship()                                  | ✅ working                    |
| ➡️ **dock/rebalance-switch**            | ❌ not built                  |
| Uniswap Trade API pricing               | ⏸️ **Paused until knowing what to implement**, but zero Uniswap code anywhere |
| Off-chain agent triggering switches     | ❌                            |
| 3-strategy UI                           | ✅ visual only, not wired     |
| Live chart vs Uniswap price             | ❌                            |
| ➡️ **Taker swap (real token transfer)** | ✅ MetaMask + SwapVM on fork |
| FEEDBACK.md (Uniswap hard requirement)  | ⏸️  **Paused until knowing what to implement**                          |

**MUST HAVE!**
- [x] **1inch requirement** Implement simulation to transfer tokens, a real taker swap. Should simulate a taker order (a taker swapping through SwapVM).



**Mock vs. no-mock**
✅ OK to mock: anvil fork of Robinhood chain, whale-impersonation funding, TSLA price (no Uniswap market exists for it — just label it), canned demo amounts, pre-recorded backup video.
🚫 Must be real: ship()/dock() txs against the official Aqua contract, an actual taker swap producing real ERC-20 transfers, live Uniswap Trade API calls at demo time (not a saved JSON), FEEDBACK.md + submitted form, and don't squash your commit history.

## 📅 Tuesday

- [x] Make the dashboard that allows to select among the three different strategies available

- [x] **🟩 Done** - Make the "Select" button in the UI to implement a real `ship()` flow that interact with the Robinhood local chain fork (via some backend). Should re-use same logic flow as within `main.ts`
  - [x] it should change the amounts selected based on the strategy picked. It should build the amounts for the 3 x strategies. 
  - [x] a final "Ship" button (or a more UI / UX friendly word) ship the strategy and generate the on-chain transaction.
  - [x] Should call a backend API route created + show that ship was executed show the tx hash for Robinhood + [listen to some events from the `Aqua.sol` contract](https://github.com/1inch/aqua/blob/9c5c42e5840e8741fba3597c48456c9510212b66/src/interfaces/IAqua.sol#L40-L51)
  - [x] Ideally, I want to visualise the strategy shipped to Aqua in the UI.

- [x] **🟩 Done** - Keep the wallet server-side and expose only its address through `GET /api/wallet`

## 📅 Wednesday
- [ ] Allow to enter the input amount and it will calculate the split
- [ ] Implement rebalancing logic to _"unship"_ (this should be the name of the function created in `src/lib/strategy.ts`) using `dock` -> then `ship`. We will implement this re-balancing manually first by clicking on a button for simplicity

**(Optional), to review later**
- [ ] Implement fiat conversion rate to convert crypto + stock prices into actual $$$ values


## Implementation ideas from AI agent

5. Prioritized 6-day plan

- **Tuesday 8th** 
  - ✅ prove ship() works end-to-end on the fork; 
  - ✅ build the taker swap (this is the actual 1inch qualification bar); 
  - ☑️ (**passing**) confirm Uniswap Trade API covers your target chain, grab API key.
- **Wednesday 9th** 
  — build dock() + re-ship rebalancing; 
  - ✅ wire the UI's Select button to real API routes so it triggers real fork transactions.
- **Thursday 10th** — Uniswap integration: live Trade API prices replacing the hardcoded ones; use a live price to calibrate the conservative sleeve's band.
- **Friday 11th** — the money-shot: live chart comparing your SwapVM rate vs real Uniswap price. Write FEEDBACK.md, submit the Uniswap form, add a "for judges" README section with file/line pointers. Non-negotiable, don't defer.
- **Saturday 12th** — polish, fix the small bugs above, record a backup demo video (fund → ship 3 → taker swap → switch profile → dock+re-ship → chart re-converges).
- **Sunday 13th** — final README + submission, buffer for breakage.

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
