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
|-----------|--------------------|--------------|----------|------------|
| Low risk  | USDG / WETH        | 50%          | 25%      | 20%        |
| Medium risk  | WETH / 1INCH       | 30%          | 50%      | 30%        |
| High risk | USDG / one stock   | 20%          | 25%      | 50%        |


## References

- https://github.com/1inch/swap-vm/blob/main/docs/PROGRAMS.md
- https://github.com/1inch/swap-vm/tree/main
- https://github.com/1inch/aqua
- https://github.com/1inch/sdks/tree/master/typescript/aqua
- https://developers.uniswap.org/docs
- https://developers.uniswap.org/dashboard/welcome
- https://developers.uniswap.org/hackathon-feedback
- https://github.com/Uniswap/uniswap-ai