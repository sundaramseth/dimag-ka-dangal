import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import assert from 'node:assert/strict';
import ts from 'typescript';
const code = ts.transpileModule(readFileSync(new URL('../src/online/crypto.native.ts', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
let randomCalls = 0;
const native = {
  getRandomValues: (a) => { randomCalls++; return webcrypto.getRandomValues(a); },
  randomUUID: () => webcrypto.randomUUID(),
  CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
  digest: (algorithm, data) => webcrypto.subtle.digest(algorithm, data),
};
const sandbox = { exports: {}, require: (name) => { assert.equal(name, 'expo-crypto'); return native; } };
vm.runInNewContext(code, sandbox);
sandbox.exports.ensureSecureCrypto();
const installed = vm.runInNewContext('globalThis.crypto', sandbox);
const bytes = new Uint32Array(56);
assert.equal(installed.getRandomValues(bytes), bytes);
assert.equal(randomCalls, 1);
assert(bytes.some(v => v !== 0));
const hash = await installed.subtle.digest('SHA-256', new TextEncoder().encode('abc'));
assert.equal(Buffer.from(hash).toString('hex'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
await assert.rejects(installed.subtle.digest('SHA-1', bytes), /Unsupported/);
assert.match(installed.randomUUID(), /^[a-f0-9-]{36}$/);
sandbox.exports.ensureSecureCrypto();
assert.equal(vm.runInNewContext('globalThis.crypto', sandbox), installed);
const existing = { ...sandbox, crypto: webcrypto, exports: {} };
vm.runInNewContext(code, existing);
existing.exports.ensureSecureCrypto();
assert.equal(existing.crypto, webcrypto);
console.log('Native PKCE adapter: secure RNG, S256 vector, UUID, rejection and existing crypto preserved.');
