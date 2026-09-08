# Eth Global Online Hackathon 2026

## Project Overview

Building an Aqua App with Swap VM opcodes for portfolio management, balancing liquidity between different portfolio management strategies. Funds are rebalanced automatically between liquidity pools for the liquidity provider.

**Stack used:**
- 1inch Aqua + Swap VM SDK
- anvil fork of Robinhood chain

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

## Pre-requisites

This project runs as a fork of Robinhood on anvil. Run one using the following command:

```bash
anvil --fork-url https://rpc.mainnet.chain.robinhood.com
```