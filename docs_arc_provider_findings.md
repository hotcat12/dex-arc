# External provider findings

## Official Arc RPC documentation
Source: https://docs.arc.io/arc/references/rpc-endpoints

The official Arc RPC page currently documents Arc Testnet only. Primary HTTP RPC: https://rpc.testnet.arc.io. Testnet chain ID: 5042002. Native currency: USDC. The page explicitly says mainnet endpoints and parameters are published separately when available.

## Official Arc network status
Source: https://www.arc.io/

Arc's official homepage currently states that Arc is live on public testnet and that mainnet is coming soon, with a launch announcement linked for September 16, 2026. Therefore a public production Arc Mainnet RPC cannot be safely inferred from chain ID 5042 alone before official parameters are published.

## Indexing option
Source: https://goldsky.com/chains/arc

Goldsky lists Arc as supported for mainnet and testnet and offers Edge RPC, Subgraphs, and Turbo Pipelines. A production endpoint requires a Goldsky account/project configuration; no anonymous public scanner API URL was published on the page.

## Official CCTP bridge documentation
Source: https://docs.arc.io/integrate/exchanges/cctp-bridging

The current CCTP guide is testnet-oriented. It documents Arc CCTP domain 26, testnet Arc TokenMessengerV2 `0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA`, MessageTransmitterV2 `0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275`, and testnet USDC `0x3600000000000000000000000000000000000000`. It describes the approve -> depositForBurn -> Circle attestation API -> receiveMessage lifecycle. These addresses must not be used for production mainnet without an official mainnet deployment reference.

## Implementation implication

Dex ARC can safely provide: contract-address validation, metadata lookup once an official RPC is configured, wallet chain detection, a clearly disabled/unavailable state when providers are not configured, and a configurable CCTP/provider handoff. It must not hardcode testnet endpoints or infer production router/bridge addresses from third-party claims.
