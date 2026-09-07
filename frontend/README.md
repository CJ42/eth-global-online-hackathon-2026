# bun-react-tailwind-shadcn-template

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

# TODO List

- [ ] Make the dashboard that allows to enter the amount in $$$ and it will then allow you to select among the three different strategies

What you actually build
A profile LP manager for one wallet.

User picks Conservative / Balanced / Aggressive. You ship three Aqua strategies you own:

| Sleeve    | Pair (Robinhood)   | Conservative | Balanced | Aggressive |
|-----------|--------------------|--------------|----------|------------|
| Low risk  | USDG / WETH        | 50%          | 25%      | 20%        |
| Mid risk  | WETH / 1INCH       | 30%          | 50%      | 30%        |
| High risk | USDG / one stock   | 20%          | 25%      | 50%        |

**Example:** User has $1000 and picks Conservative.

Approve USDG + WETH + stock to Aqua.
ship three strategies with virtual balances ≈ $500 / $300 / $200.
Dashboard shows those 3 strategyHashes.
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
