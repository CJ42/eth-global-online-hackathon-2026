# Next.js UI

To install dependencies:

```bash
bun install
```

To start a development server:

```bash
bun dev
```

To run for production:

```bash
bun start
```

This project was created using `bun init` in bun v1.3.3. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.

# ☑️ Implementation List (roadmap)

| Planned                                 | Status                       |
| --------------------------------------- | ---------------------------- |
| ship()                                  | ✅ working                    |
| ➡️ **dock/rebalance-switch**            | ❌ not built                  |
| Uniswap Trade API pricing               | ⏸️ **Paused until knowing what to implement**, but zero Uniswap code anywhere |
| Off-chain agent triggering switches     | ❌                            |
| 3-strategy UI                           | ✅ visual only, not wired     |
| Live chart vs Uniswap price             | ❌                            |
| ➡️ **Taker swap (real token transfer)** | ❌                            |
| FEEDBACK.md (Uniswap hard requirement)  | ⏸️  **Paused until knowing what to implement**                          |

**MUST HAVE!**
- [ ] **1inch requirement** Implement simulation to transfer tokens, a real taker swap. Should simulate a taker order (a taker swapping through SwapVM).

**Mock vs. no-mock**
✅ OK to mock: anvil fork of Robinhood chain, whale-impersonation funding, TSLA price (no Uniswap market exists for it — just label it), canned demo amounts, pre-recorded backup video.
🚫 Must be real: ship()/dock() txs against the official Aqua contract, an actual taker swap producing real ERC-20 transfers, live Uniswap Trade API calls at demo time (not a saved JSON), FEEDBACK.md + submitted form, and don't squash your commit history.

## 📅 Tuesday

- [x] Make the dashboard that allows to select among the three different strategies available

- [ ] **🟪 In Review** Make the "Select" button in the UI to implement a real `ship()` flow that interact with the Robinhood local chain fork (via some backend). Should re-use same logic flow as within `main.ts`
  - [x] it should change the amounts selected based on the strategy picked. It should build the amounts for the 3 x strategies. 
  - [x] a final "Ship" button (or a more UI / UX friendly word) ship the strategy and generate the on-chain transaction.
  - [x] Should call a backend API route created + show that ship was executed show the tx hash for Robinhood + [listen to some events from the `Aqua.sol` contract](https://github.com/1inch/aqua/blob/9c5c42e5840e8741fba3597c48456c9510212b66/src/interfaces/IAqua.sol#L40-L51)
  - [x] Ideally, I want to visualise the strategy shipped to Aqua in the UI.

- [ ] Change `config.ts` to move the wallet server-side behind an API route. Split the logic in the backend with the API, create an `api/` route like `GET /wallet` to get the user wallet

## 📅 Wednesday
- [ ] Allow to enter the input amount and it will calculate the split
- [ ] Implement rebalancing logic to _"unship"_ (this should be the name of the function created in `src/lib/strategy.ts`) using `dock` -> then `ship`. We will implement this re-balancing manually first by clicking on a button for simplicity

**(Optional), to review later**
- [ ] Implement fiat conversion rate to convert crypto + stock prices into actual $$$ values


## Implementation ideas from AI agent

5. Prioritized 6-day plan

- **Tuesday 8th** — prove ship() works end-to-end on the fork; build the taker swap (this is the actual 1inch qualification bar); confirm Uniswap Trade API covers your target chain, grab API key.
- **Wednesday 9th** — build dock() + re-ship rebalancing; wire the UI's Select button to real API routes so it triggers real fork transactions.
- **Thursday 10th** — Uniswap integration: live Trade API prices replacing the hardcoded ones; use a live price to calibrate the conservative sleeve's band.
- **Friday 11th** — the money-shot: live chart comparing your SwapVM rate vs real Uniswap price. Write FEEDBACK.md, submit the Uniswap form, add a "for judges" README section with file/line pointers. Non-negotiable, don't defer.
- **Saturday 12th** — polish, fix the small bugs above, record a backup demo video (fund → ship 3 → taker swap → switch profile → dock+re-ship → chart re-converges).
- **Sunday 13th** — final README + submission, buffer for breakage.