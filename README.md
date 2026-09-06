# Dex ARC

Dex ARC is a polished, responsive market-intelligence dashboard for ARC Mainnet tokens and pairs. The current product shell includes searchable and sortable market tables, trend and activity views, pair metrics, a wallet/network confirmation flow, a Uniswap-compatible swap handoff, and a configurable bridge handoff.

## Product boundaries

The dashboard is designed to keep high-risk blockchain actions explicit. Dex ARC never silently signs or submits a transaction. A user must connect an injected wallet, be detected on ARC Mainnet, review the requested swap or bridge action, and then confirm inside the wallet/provider.

The scanner UI reads from `VITE_ARC_SCANNER_API_URL` when configured. The endpoint may return either an array of market rows or `{ "markets": [...] }`. Each row can include `pair`, `ticker`, `price`, `change` or `change24h`, `volume` or `volume24h`, `liquidity`, `fdv`, `txns` or `transactions`, `address`, and optional `rank`/`color`. Without that endpoint, the UI intentionally shows a clearly labelled preview fallback so the experience remains reviewable before an indexer is connected.

Swap and bridge actions use safe provider handoff URLs. The app does not embed private keys or execute contract calls. Configure the official provider URLs before production use and validate their chain support independently.

## Environment variables

Create a Vercel project from this repository and add the following variables in the Vercel dashboard. Public `VITE_*` values are bundled into the browser, so never put secrets or private keys in them.

| Variable | Required | Purpose |
|---|---:|---|
| `VITE_ARC_RPC_URL` | Optional | Public ARC Mainnet RPC used by a future data or wallet layer. The UI identifies ARC Mainnet as chain ID `5042`. |
| `VITE_ARC_SCANNER_API_URL` | Recommended | HTTPS JSON endpoint for indexed ARC token/pair data. The UI falls back to preview rows when absent or unavailable. |
| `VITE_SWAP_PROVIDER_URL` | Recommended | Official Uniswap-compatible swap URL or your audited route service. It opens only after the user confirms the handoff. |
| `VITE_BRIDGE_PROVIDER_URL` | Recommended | Official ARC bridge/CCTP provider URL. It opens only after the user confirms the bridge handoff. |

Use the variable table above as the Vercel configuration checklist. Do not commit a real `.env` file.

## Local development

```bash
pnpm install
pnpm dev
```

Validation commands:

```bash
pnpm check
pnpm test
pnpm build
```

## GitHub to Vercel

Create a new GitHub repository, upload the project files, and push the repository. In Vercel, choose **New Project**, import the GitHub repository, keep the detected Node/Vite build settings, add the environment variables above, and deploy. The app can also run on another static-capable host because the frontend is a standard Vite build and the project includes the managed server template for future API work.

## Production checklist

Before presenting real markets, replace the fallback with a trusted ARC indexer and verify response freshness, token decimals, pair addresses, liquidity calculations, and rate limits. Before enabling a swap or bridge URL, confirm that the provider supports ARC Mainnet and that the URL is an official provider endpoint. Add audited contract-call code only after defining token allowlists, slippage limits, transaction simulation, and failure recovery.
