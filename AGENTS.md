# Eth Global Online Hackathon 2026 - Agents Guideline

## Your role

You are an AI pair programmer assisting Jean to build an innovative hackathon submission that integrates very well 1inch and Uniswap.

**⚠️ Important timeline: we have 10 days!**

## Project Overview

See @README.md section "Project Overview" for brief overview and portfolio strategies available.

## Integration Roadmap ideas

- Interact with the Uniswap Trade API
- a nice UI to display and interact with the different strategies to balance liquidity
- Ideally, AI agents SHOULD be able to use this product too
- We need to pick one single chain, Uniswap Trade API is used to fetch and display prices
- Probably interesting to do something with RWA and tokenized stocks, where I can manage liquidity between pools and tokenized stocks like Tesla, SpaceX, etc…

## Partner Prizes Criterias

### 🦄 Uniswap

Build on or integrate any part of the Uniswap stack, including the Uniswap API, the Uniswap AMM (v2, v3, or v4), CCA, or any other Uniswap protocol. This also includes new v4 hooks, extensions or improvements to official Uniswap repositories, and tooling or solutions built for the broader ecosystem.

**Qualification Requirements**
A public GitHub repository with open-source code, a FEEDBACK.md file, and a completed submission to the Uniswap Developer Feedback Form (https://developers.uniswap.org/hackathon-feedback) that includes the link to your FEEDBACK.md file.

Submissions without it will be reviewed and audited before winners are finalized. Make sure your README clearly points to the relevant contracts and lines of code so we can verify your integration.

### 🐴 1inch

Create a custom Aqua app that implements a sophisticated DeFi position. If you use SwapVM, you may modify SwapVM opcodes and define your own instructions. The final positions must be demonstrated through tests scripts or a UI.

Projects that utilize SwapVM will be scored higher during the final judging.

**Qualification Requirements**
Official Aqua/SwapVM contracts must be used (redeployments of a modified SwapVM contract is allowed)
Onchain execution of token transfers should be presented during the final demo (local forks are ok)
Proper Git commit history (no single-commit entries on the final day)

## Project Structure

```
public/               
├── fonts/                            # Brutal Type .otf files (tracked; licence-sensitive)     
src/
├── app/                              # Next.js App Router routes
│   └── api/
├── components/
│   └── StrategyCard/                 # Example of a component
│       ├── StrategyCard.tsx          
│       └── StrategyCard.module.css   
│       └── index.ts                  
├── config.ts
├── constants.ts
├── hooks/
├── lib/
├── styles/
└── types/
```


## Coding Conventions & Guidelines

 
- `src/components/` holds shared components
- `src/lib/` holds pure logic
- `src/hooks/` holds hooks start with word `use{Something}`
- No inline styles — use Tailwind classes or tokens in `src/styles/arkiv-tokens.css`
- Use shadcn for building the UI parts of the components


- Avoid very verbose code comments, minimize them explain in code comments what is not obvious, rationales and why. Do not re-explain in code comments what the code already does and what is self-explanatory


Re-usability is a priority
- **Re-use shared configs from `src/config` as much as possible**. Avoid having duplications for these constant values
- **Re-use existing React components**, avoid building new ones
- When creating a component for a new feature, prioritise building shared components that can be re-used afterwards.
- Define React component properties with `type` (not `interface`). Always define them above the component definition so that component properties are quickly detectable and visible

## Security & Hard rules

- `src/components/ui/` is shadcn-generated — regenerate, DO NOT hand-edit it.

## References

Use the following documentation and references to help you integrate

- https://github.com/1inch/swap-vm/blob/main/docs/PROGRAMS.md
- https://github.com/1inch/swap-vm/tree/main
- https://github.com/1inch/aqua
- https://github.com/1inch/sdks/tree/master/typescript/aqua
- https://developers.uniswap.org/docs
- https://developers.uniswap.org/dashboard/welcome
- https://developers.uniswap.org/hackathon-feedback
- https://github.com/Uniswap/uniswap-ai


## Package manager

Default to using Bun instead of Node.js package managers.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run` / `yarn` / `pnpm run`
- Bun automatically loads `.env`, so don't use dotenv

This frontend is a Next.js App Router app with shadcn/ui. Do not scaffold a Bun.serve HTML import app or Vite app here.


