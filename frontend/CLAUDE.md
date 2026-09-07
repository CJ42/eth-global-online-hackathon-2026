---
description: Use Bun instead of npm, pnpm, or yarn. Next.js App Router for the UI.
globs: "*.ts, *.tsx, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

Default to using Bun instead of Node.js package managers.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run` / `yarn` / `pnpm run`
- Bun automatically loads `.env`, so don't use dotenv

This frontend is a Next.js App Router app with shadcn/ui. Do not scaffold a Bun.serve HTML import app or Vite app here.
