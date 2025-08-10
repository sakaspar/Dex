DEX Arbitrage Scanner

Overview

Multi-chain DEX arbitrage opportunity scanner built with React, TypeScript, Vite, and Tailwind CSS. It includes a mock-driven UI for scanning, analytics, and settings, plus a standalone HTML prototype (`decx.html`) that fetches real-time USDT pairs via DexScreener.

Features

- Multi-page UI: Dashboard, Scanner, Analytics, Settings
- Mock data for opportunities, chains, and DEXs
- Price/gas service scaffolding with caching and CoinGecko fallback
- Tailwind styling and Recharts visualizations
- Standalone prototype page (`decx.html`) with live aggregation via DexScreener

Requirements

- Node.js 18+ and npm (or pnpm/yarn)
- Internet access for external APIs when using `decx.html`

Getting Started

1) Install dependencies

```bash
npm install
```

2) Run the dev server

```bash
npm run dev
```

This starts Vite on `http://localhost:3000` and opens your browser.

3) Build for production

```bash
npm run build
```

4) Preview the production build

```bash

npm run preview
```

Project Structure

- `src/App.tsx`: Router and page layout
- `src/pages/*`: Pages (`Dashboard`, `ArbitrageScanner`, `Analytics`, `Settings`)
- `src/services/*`: Price and arbitrage service scaffolding
- `src/data/mockData.ts`: Supported chains/DEXs and mock opportunities
- `src/types/index.ts`: Shared TypeScript types
- `index.html`: Vite app entry
- `decx.html`: Standalone demo page using DexScreener (no build needed)

Notes and Limitations

- The UI uses mock data for opportunities. `src/services/priceService.ts` includes example fetchers for Uniswap/Sushi subgraphs and CoinGecko fallback but is not fully wired into the UI.
- Replace placeholder RPCs (e.g., Infura) in `src/data/mockData.ts` with valid endpoints for real `ethers` calls.
- Some DEX fetchers (e.g., PancakeSwap) are marked as not implemented and will fall back to aggregators where applicable.

Troubleshooting

- If Tailwind classes don’t apply in builds, ensure `postcss.config.js` and `tailwind.config.js` are CommonJS (already configured).
- If `ethers` is missing, run `npm install ethers` (already declared in dependencies).
- For network errors in `decx.html`, it uses CORS proxy fallbacks but can still be blocked; try another network or disable strict blockers.

Scripts

- `npm run dev`: Start dev server on port 3000
- `npm run build`: Production build
- `npm run preview`: Preview the production build
- `npm run lint`: Run ESLint

License

MIT


