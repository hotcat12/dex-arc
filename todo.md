# Project TODO

- [x] Define Dex ARC product structure, data model, integration boundaries, and acceptance criteria
- [x] Build the responsive dark Dex ARC scanner shell with D-logo-inspired cyan, electric-blue, and lime visual system
- [x] Add custom Dex ARC mark and deployment-safe brand asset handling
- [x] Add ARC Mainnet status indicator and network configuration surface
- [x] Add searchable and sortable token/pair market tables
- [x] Add trending markets, token metrics, volume/liquidity/FDV cards, and recent activity views
- [x] Add pair-detail navigation and detail view with chart/metrics presentation
- [x] Add wallet-connect flow with explicit confirmation before wallet/network actions
- [x] Add Uniswap-compatible swap interface with token selectors, route summary, slippage controls, and safe provider handoff
- [x] Add multi-chain bridge interface with source/destination selection, quote/status presentation, and configurable official provider links
- [x] Add integration configuration and environment-variable documentation for ARC RPC, scanner data, swap, and bridge providers
- [x] Add unit tests for market filtering/sorting and transaction-confirmation guards
- [x] Run type checks and test suite
- [x] Capture desktop and mobile screenshots for visual verification
- [x] Save final checkpoint and provide GitHub/Vercel deployment guidance

- [x] Wire scanner markets/trends/pair details to a configurable ARC data endpoint with a clearly marked fallback state
- [x] Fix numeric sorting for formatted volume/liquidity values
- [x] Implement EIP-1193 wallet connection and ARC network detection with explicit pre-action confirmation
- [x] Add slippage controls and safe external swap-provider handoff
- [x] Add bridge quote/status presentation and configurable official provider handoff
- [x] Add README and environment-variable deployment documentation
- [x] Ensure client market/guard tests are discovered by Vitest

- [x] Replace Beta presentation with Mainnet product branding and live-status language
- [x] Add contract-address token import/search and token detail display
- [x] Add real ARC Mainnet RPC/indexer configuration and live token/pair data path
- [x] Add wallet chain switching, token approval, and explicit swap transaction flow
- [x] Add BSC ↔ ARC bridge provider configuration, quote/status, and confirmed transaction handoff
- [x] Add live mainnet environment/provider documentation and safety prerequisites
- [x] Add tests for address validation, chain guards, approval guards, and transaction confirmation

- [x] Verify LI.FI supported chains/API availability for ARC and BSC
- [x] Map LI.FI quote/route/transaction responses to Dex ARC swap and bridge flows
- [x] Integrate LI.FI only when official support is confirmed, with wallet confirmation and unavailable guards
- [x] Add LI.FI environment/configuration documentation and tests

- [x] Wire LI.FI quote/route/transaction handling into the swap module or explicitly scope LI.FI to bridge-only
- [x] Add deterministic unsupported/no-route/wrong-chain states for LI.FI swap and bridge flows

- [x] Add explicit bridge unavailable/no-route status and deterministic UI messaging
- [x] Add tests for LI.FI bridge no-route and wrong-chain status transitions

- [x] Document live scanner support as configurable-provider mode with fallback until a verified ARC indexer endpoint is supplied
- [x] Add explicit ERC-20 allowance/approval state handling before LI.FI swap or bridge transaction submission
- [x] Add Vitest coverage for token address validation, wallet chain guards, approval-required paths, and transaction rejection

- [x] Add Vitest tests for tokenData address validation and invalid-address errors
- [x] Add tests for wallet chain guard/switch behavior
- [x] Add tests for approval-required and transaction-rejection decision paths

- [x] Add a Vitest test for fetchTokenMetadata malformed-address error handling

- [x] Diagnose why contract-address search returns metadata without live pair/price data
- [x] Verify an ARC-compatible external DEX scanner/indexer API with address lookup
- [x] Wire live pair price, liquidity, volume, and pair selection into token search
- [x] Add explicit no-pair/no-price and provider error states
- [x] Add tests for provider response normalization and address lookup behavior

- [x] Remove all demo/fallback market rows from the production UI
- [x] Use verified ARC Mainnet pool results only, with real token images and live metrics
- [x] Fix contract-address lookup for addresses such as 0x99b37b7f...
- [x] Replace synthetic charts with real pool activity data or an explicit unavailable state
- [x] Add regression tests for no-demo rendering, address lookup, images, and chart states

- [x] Remove unconditional verified-pair wording and eliminate fake initials from token logo UI
- [x] Add a successful recorded live lookup fixture for 0x99b37b7fccaa7a1030617b6195eb3045c523bb97
- [x] Add deterministic tests for real token image mapping and chart unavailable state

- [x] Add same-origin server proxy for A/X live pools and candles to avoid browser CORS failures
