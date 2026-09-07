# Eth Global Online Hackathon 2026

## Project Overview

Building an Aqua App with Swap VM opcodes for portfolio management, balancing liquidity between different portfolio management strategies. Funds are rebalanced automatically between liquidity pools for the liquidity provider.

### Liquidity profiles

3 types can be used

| Profile      | Stable Coins (e.g: USDC, EURC) | Crypto Assets (e.g: LINK) | Risky Volatile Assets (e.g: ETH) |
|--------------|-------------------------------|---------------------------|----------------------------------|
| Conservative | 50%                           | 30%                       | 20%                              |
| Balanced     | 25%                           | 50%                       | 25%                              |
| Aggressive   | 20%                           | 30%                       | 50%                              |

Let's imagine to start there are 3 pools:

- **Low-Risk**: USDC, EURC (Stable coins, low risk) -> we will use the pool USDC / EURC
- **Medium-Risk**: ETH, wBTC -> we will use the pool ETH / LINK
- **High Risk**: PEPE, LINK

We will use the Ethereum network.

Or we could use the 1inch Aqua API on Robinhood to trade tokenized stocks.

## References

- https://github.com/1inch/swap-vm/blob/main/docs/PROGRAMS.md
- https://github.com/1inch/swap-vm/tree/main
- https://github.com/1inch/aqua
- https://github.com/1inch/sdks/tree/master/typescript/aqua
- https://developers.uniswap.org/docs
- https://developers.uniswap.org/dashboard/welcome
- https://developers.uniswap.org/hackathon-feedback
- https://github.com/Uniswap/uniswap-ai