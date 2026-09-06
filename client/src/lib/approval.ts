export function isNativeToken(address: string) {
  return address.toLowerCase() === "0x0000000000000000000000000000000000000000" || address.toLowerCase() === "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";
}

function padAddress(address: string) {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

export function allowanceCallData(owner: string, spender: string) {
  return `0xdd62ed3e${padAddress(owner)}${padAddress(spender)}`;
}

export function approveCallData(spender: string, amount = "f".repeat(64)) {
  return `0x095ea7b3${padAddress(spender)}${amount.padStart(64, "0")}`;
}

export function allowanceNeedsApproval(allowance: string | bigint, required: string | bigint) {
  return BigInt(allowance) < BigInt(required);
}

export function approvalDecision(input: { token: string; approvalAddress?: string; allowance: string | bigint; required: string | bigint }) {
  if (!input.approvalAddress || isNativeToken(input.token)) return "not-required" as const;
  return allowanceNeedsApproval(input.allowance, input.required) ? "required" as const : "sufficient" as const;
}

export function isWalletRejection(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: unknown }).code : undefined;
  return code === 4001 || (error instanceof Error && /reject|denied|cancel/i.test(error.message));
}
