import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

test('auth relay keeps nonce, allowlist, and postMessage flow without sessionStorage', () => {
  const relay = fs.readFileSync(path.join(root, 'apps', 'sites', 'auth-headysystems', 'relay.html'), 'utf8');
  assert.match(relay, /ALLOWED_ORIGINS/);
  assert.match(relay, /postMessage/);
  assert.match(relay, /nonce/);
  assert.doesNotMatch(relay, /sessionStorage/);
});

test('platform auth module exposes JWT and service auth layers', () => {
  const auth = fs.readFileSync(path.join(root, 'packages', 'platform', 'src', 'auth', 'index.js'), 'utf8');
  assert.match(auth, /class JwtValidator/);
  assert.match(auth, /serviceAuthMiddleware/);
  assert.match(auth, /ReceiptSigner/);
});
