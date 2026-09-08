# Dex ARC

Dex ARC is a polished, responsive market-intelligence dashboard for ARC Mainnet tokens and pairs. The current product shell includes searchable and sortable market tables, trend and activity views, pair metrics, a wallet/network confirmation flow, a Uniswap-compatible swap handoff, and a configurable bridge handoff.

## Product boundaries

The dashboard is designed to keep high-risk blockchain actions explicit. Dex ARC never silently signs or submits a transaction. A user must connect an injected wallet, be detected on ARC Mainnet, review the requested swap or bridge action, and then confirm inside the wallet/provider.

The scanner UI reads from `VITE_ARC_SCANNER_API_URL` when configured. The endpoint may return either an array of market rows or `{ "markets": [...] }`. Each row can include `pair`, `ticker`, `price`, `change` or `change24h`, `volume` or `volume24h`, `liquidity`, `fdv`, `txns` or `transactions`, `address`, and optional `rank`/`color`. Because no verified ARC indexer endpoint is hardcoded, the project intentionally shows a clearly labelled preview/manual fallback until you configure a trusted live indexer.

Swap and bridge actions use LI.FI quote and transaction responses when a supported route is available. The app never stores private keys. Before a returned transaction is sent, Dex ARC checks the ERC-20 allowance and requests a separate wallet-confirmed approval when required. If no LI.FI route is available, the UI shows an unavailable state instead of submitting a guessed transaction.

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

Create a new GitHub repository, upload the project files, and push the repository. In Vercel, choose **New Project**, import the GitHub repository, and leave the project root at the repository root. The committed `vercel.json` explicitly runs `pnpm run build`, serves `dist/public`, routes browser requests to the SPA entrypoint, and maps `/api/*` to the Express serverless handler. Do not set the Vercel Output Directory to `server`, `server/_core`, or `dist`—use the committed configuration. Add the environment variables above, then deploy. The API handler preserves the ARC Explorer proxy and tRPC routes in Vercel deployments.

## Production checklist

Before presenting real markets, replace the fallback with a trusted ARC indexer and verify response freshness, token decimals, pair addresses, liquidity calculations, and rate limits. Before enabling a swap or bridge URL, confirm that the provider supports ARC Mainnet and that the URL is an official provider endpoint. Add audited contract-call code only after defining token allowlists, slippage limits, transaction simulation, and failure recovery.

## LI.FI integration

Dex ARC now uses the public LI.FI Production API (`https://li.quest/v1`) for supported-chain discovery and quote requests. LI.FI's current registry reports Arc Mainnet as chain ID `5042` with key `arc` and BSC Mainnet as chain ID `56` with key `bsc`. The dashboard requests a quote for the selected source chain into Arc, displays the estimated receive amount and selected tool, and only sends the returned `transactionRequest` after the user confirms in the wallet.

The current bridge path supports BSC, Ethereum, Base, and Arbitrum as selectable source networks and uses Arc USDC `0x3600000000000000000000000000000000000000` as the destination asset. BSC USDC is `0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d`. Token addresses and provider outputs must still be validated before production use.

Optional configuration:

| Variable | Purpose |
|---|---|
| `VITE_LIFI_API_KEY` | Optional LI.FI API key sent as `x-lifi-api-key`; use the Vercel dashboard, never commit it. |
| `VITE_ARC_MAINNET_ENABLED` | Set to `false` to disable signing while reviewing providers. It defaults to enabled for the LI.FI-listed Arc Mainnet configuration. |
| `VITE_ARC_MAINNET_CHAIN_ID` | Optional override; defaults to hexadecimal `0x13b2` (decimal 5042). |
| `VITE_ARC_RPC_URL` | Optional override; defaults to the public RPC reported by the LI.FI chain registry: `https://arc-rpc.transferto.xyz/`. |

The app does not hold private keys. Wallets perform the final approval and transaction signing, and users can reject every request. For a production launch, confirm LI.FI route availability, token support, API quotas, RPC reliability, and the destination chain's official explorer before publishing.

References used for the integration are [LI.FI chain API](https://docs.li.fi/api-reference/get-information-about-all-currently-supported-chains), [LI.FI quote API](https://docs.li.fi/api-reference/get-a-quote-for-a-token-transfer), [LI.FI SDK overview](https://docs.li.fi/sdk/overview), and [Arc's LI.FI partner note](https://community.arc.io/public/blogs/arc-x-lifi-crosschain-routing-and-liquidity-access-for-arc-builders).

## Vercel production verification

After importing the repository into Vercel, verify the deployed application in this order. First open the root URL and confirm that the Dex ARC interface renders instead of source code. Next request `/api/arc/pools?limit=2`; a successful deployment returns JSON from A/X Explorer with live pool rows, prices, liquidity, volume, and token metadata. Choose a returned pool address and open `/pair/<pool-address>` directly to confirm that Vercel serves the SPA entry point for client-side routing. The pair page renders live token image elements and the inline `live-pair-chart` SVG when A/X returns more than one candle; its `data-chart-points` attribute records the rendered candle-point count. The brand mark is inline SVG, so it does not depend on a Manus-only image URL.

The production verification used the deployed `dexarc.vercel.app` URL. The root page returned HTTP 200 HTML, the pool endpoint returned HTTP 200 JSON, and `/api/arc/pools?address=<pool>&days=all&interval=15m` returned HTTP 200 JSON containing `candles`. A direct pair route returned HTTP 200 with the Dex ARC SPA title. Headless browser rendering confirmed live pair names, token logo `<img>` elements, the `Dex ARC logo` inline SVG marker, and the real chart SVG marker when candle history was available. If an individual token image host is unavailable, the market row remains live and the UI intentionally shows its explicit no-logo state rather than fabricated content.
