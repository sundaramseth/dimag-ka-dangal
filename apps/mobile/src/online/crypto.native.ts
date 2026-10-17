import * as ExpoCrypto from "expo-crypto";

// Supabase PKCE must use native secure randomness and S256 on Hermes too.
// This is deliberately a minimal adapter, not a general Web Crypto polyfill.
export function ensureSecureCrypto() {
  const current = globalThis.crypto as (Partial<Omit<Crypto, "subtle">> & { subtle?: Partial<SubtleCrypto> }) | undefined;
  if (current?.getRandomValues && current?.subtle?.digest) return;
  const crypto = current || {};
  if (!crypto.getRandomValues)
    Object.defineProperty(crypto, "getRandomValues", {
      value: ExpoCrypto.getRandomValues,
      configurable: true,
    });
  if (!crypto.randomUUID)
    Object.defineProperty(crypto, "randomUUID", {
      value: ExpoCrypto.randomUUID,
      configurable: true,
    });
  if (!crypto.subtle?.digest) {
    const subtle = crypto.subtle || {};
    Object.defineProperty(subtle, "digest", {
      value: (algorithm: AlgorithmIdentifier, data: BufferSource) => {
        const name = typeof algorithm === "string" ? algorithm : algorithm.name;
        if (name.toUpperCase() !== "SHA-256")
          return Promise.reject(new Error("Unsupported digest algorithm"));
        return ExpoCrypto.digest(ExpoCrypto.CryptoDigestAlgorithm.SHA256, data);
      },
      configurable: true,
    });
    if (!crypto.subtle)
      Object.defineProperty(crypto, "subtle", { value: subtle, configurable: true });
  }
  if (!current)
    Object.defineProperty(globalThis, "crypto", { value: crypto, configurable: true });
}
