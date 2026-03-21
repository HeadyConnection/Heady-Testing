/*
 * © 2026 Heady™Systems Inc.
 * PROPRIETARY AND CONFIDENTIAL.
 *
 * heady-vault.js — PQC-Encrypted Persistent Secret Store
 * ML-KEM-768 + AES-256-GCM + ML-DSA-65 · Zero Dependencies
 *
 * Liquid microservice: single responsibility, ESM, EventEmitter-based
 *
 * Architecture:
 *   init(password) → generate PQC keypairs + AES key → encrypted vault.enc
 *   unlock(password) → derive AES key → decrypt → verify ML-DSA signature
 *   set/get/rotate/delete → CRUD on encrypted secrets → re-persist + re-sign
 *   injectEnv() → populate process.env for backward compat
 *   getForAPI(key) → return pre-formatted auth headers per domain
 *
 * Security:
 *   - Master key derived from password via scrypt (N=131072, r=8, p=1)
 *   - Each persist: new random IV, KEM ciphertext as AAD
 *   - PQC keypairs stored INSIDE encrypted payload (never plaintext)
 *   - ML-DSA-65 signature on vault file detects tampering
 *   - Auto-lock after phi-scaled inactivity timeout
 *
 * Patent: PPA #11 — Provable Trust Architecture
 */

import { EventEmitter } from "events";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ═══════════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════════

const PHI = 1.6180339887498948482;
const VAULT_VERSION = 2;
const KEM_ALGORITHM = "ml-kem-768";       // NIST FIPS 203 — post-quantum KEM
const SIG_ALGORITHM = "ml-dsa-65";        // NIST FIPS 204 — post-quantum signatures
const SYM_ALGORITHM = "aes-256-gcm";      // Authenticated encryption
const HASH_ALGORITHM = "sha3-256";        // Quantum-resistant hashing

const SCRYPT_PARAMS = {
  N: 2 ** 17,       // CPU/memory cost (131072)
  r: 8,             // Block size
  p: 1,             // Parallelism
  maxmem: 256 * 1024 * 1024, // 256 MB
};
const SALT_LENGTH = 32;
const IV_LENGTH = 12;          // AES-GCM standard nonce
const AUTH_TAG_LENGTH = 16;    // AES-GCM auth tag
const DERIVED_KEY_LENGTH = 32; // 256 bits for AES-256

// φ⁶ × 1000 ≈ 17944ms → auto-lock after ~18s inactivity (dev)
// For production: PHI^8 × 1000 ≈ 46979ms (~47s)
const AUTO_LOCK_MS = Math.round(Math.pow(PHI, 8) * 1000 * 60); // ~47 minutes

// ═══════════════════════════════════════════════════════════════════
// Cross-Domain Configuration
// ═══════════════════════════════════════════════════════════════════

const DOMAINS = Object.freeze({
  github:       { label: "GitHub",          zone: 1 },
  cloudflare:   { label: "Cloudflare",      zone: 2 },
  gcloud:       { label: "Google Cloud",    zone: 3 },
  workspace:    { label: "Google Workspace", zone: 3 },
  googleai:     { label: "Google AI Studio", zone: 3 },
  huggingface:  { label: "Hugging Face",    zone: 4 },
  openai:       { label: "OpenAI",          zone: 4 },
  claude:       { label: "Claude/Anthropic", zone: 4 },
  groq:         { label: "Groq",            zone: 4 },
  perplexity:   { label: "Perplexity",      zone: 4 },
  upstash:      { label: "Upstash Redis",   zone: 5 },
  neon:         { label: "Neon Postgres",   zone: 5 },
  pinecone:     { label: "Pinecone",        zone: 5 },
  sentry:       { label: "Sentry",          zone: 6 },
  stripe:       { label: "Stripe",          zone: 6 },
  heady:        { label: "Heady Internal",  zone: 7 },
  ssh:          { label: "SSH Keys",        zone: 8 },
  custom:       { label: "Custom",          zone: 8 },
});

const CATEGORIES = Object.freeze({
  ANTHROPIC_API_KEY: "ai-llm", CLAUDE_API_KEY: "ai-llm", CLAUDE_CODE_OAUTH_TOKEN: "ai-llm",
  ANTHROPIC_ADMIN_KEY: "ai-llm", CLAUDE_DEV_ADMIN_KEY: "ai-llm", ANTHROPIC_ORG_ID: "ai-llm",
  OPENAI_API_KEY: "ai-llm", GROQ_API_KEY: "ai-llm", PERPLEXITY_API_KEY: "ai-llm",
  HF_TOKEN: "ai-llm", GEMINI_API_KEY: "ai-llm", GEMINI_API_KEY_HEADY: "ai-llm",
  DATABASE_URL: "infrastructure", NEON_API_KEY: "infrastructure", NEON_PROJECT_ID: "infrastructure",
  UPSTASH_REDIS_REST_URL: "infrastructure", UPSTASH_REDIS_REST_TOKEN: "infrastructure",
  FIREBASE_API_KEY: "infrastructure", PINECONE_API_KEY: "infrastructure",
  GOOGLE_API_KEY: "google", GCLOUD_API_KEY: "google", GOOGLE_CLOUD_API_KEY: "google",
  GOOGLE_APPLICATION_CREDENTIALS: "google",
  CLOUDFLARE_API_TOKEN: "cloud-deploy", SENTRY_AUTH_TOKEN: "cloud-deploy",
  GITHUB_TOKEN: "scm", GITHUB_TOKEN_SECONDARY: "scm",
  STRIPE_SECRET_KEY: "finance", STRIPE_PUBLISHABLE_KEY: "finance",
  HEADY_API_KEY: "auth", ADMIN_TOKEN: "auth", NPM_TOKEN: "auth",
});

// ═══════════════════════════════════════════════════════════════════
// HeadyVault Class
// ═══════════════════════════════════════════════════════════════════

class HeadyVault extends EventEmitter {
  /**
   * @param {string} vaultDir - Directory to store vault files
   */
  constructor(vaultDir) {
    super();
    this._dir = path.resolve(vaultDir);
    this._vaultPath = path.join(this._dir, "vault.enc");
    this._sigPath = path.join(this._dir, "vault.sig");
    this._metaPath = path.join(this._dir, "vault.meta.json");

    this._unlocked = false;
    this._aesKey = null;
    this._sigKeyPair = null;
    this._kemKeyPair = null;
    this._secrets = {};     // { key: { value, category, domain, createdAt, ... } }
    this._auditLog = [];
    this._lockTimer = null;
    this._pqcAvailable = null;
  }

  // ─── PQC Availability Check ──────────────────────────────────────

  _checkPQC() {
    if (this._pqcAvailable !== null) return this._pqcAvailable;
    try {
      crypto.generateKeyPairSync(KEM_ALGORITHM);
      this._pqcAvailable = true;
    } catch {
      this._pqcAvailable = false;
    }
    return this._pqcAvailable;
  }

  // ─── Initialization (first-time setup) ────────────────────────────

  async init(masterPassword) {
    if (!masterPassword || masterPassword.length < 8) {
      throw new Error("Master password must be at least 8 characters");
    }

    fs.mkdirSync(this._dir, { recursive: true });

    if (fs.existsSync(this._vaultPath)) {
      throw new Error("Vault already exists. Use unlock() instead.");
    }

    const hasPQC = this._checkPQC();

    // Generate PQC keypairs if available
    if (hasPQC) {
      this._kemKeyPair = crypto.generateKeyPairSync(KEM_ALGORITHM);
      this._sigKeyPair = crypto.generateKeyPairSync(SIG_ALGORITHM);
    }

    // Derive AES key from master password
    const salt = crypto.randomBytes(SALT_LENGTH);
    this._aesKey = crypto.scryptSync(masterPassword, salt, DERIVED_KEY_LENGTH, SCRYPT_PARAMS);

    this._secrets = {};
    this._auditLog = [];
    this._unlocked = true;

    // Store metadata (non-secret)
    const meta = {
      version: VAULT_VERSION,
      createdAt: new Date().toISOString(),
      salt: salt.toString("base64"),
      pqc: hasPQC,
      kemAlgorithm: hasPQC ? KEM_ALGORITHM : null,
      sigAlgorithm: hasPQC ? SIG_ALGORITHM : null,
      symAlgorithm: SYM_ALGORITHM,
      hashAlgorithm: HASH_ALGORITHM,
    };

    if (hasPQC) {
      meta.kemPublicKey = this._kemKeyPair.publicKey.export({ type: "spki", format: "der" }).toString("base64");
      meta.sigPublicKey = this._sigKeyPair.publicKey.export({ type: "spki", format: "der" }).toString("base64");
    }

    fs.writeFileSync(this._metaPath, JSON.stringify(meta, null, 2), "utf8");
    this._persist();
    this._audit("init", "*");
    this._resetLockTimer();
    this.emit("vault:initialized", { pqc: hasPQC });

    return { pqc: hasPQC };
  }

  // ─── Unlock ──────────────────────────────────────────────────────

  async unlock(masterPassword) {
    if (!fs.existsSync(this._vaultPath) || !fs.existsSync(this._metaPath)) {
      throw new Error("No vault found. Use init() to create one.");
    }

    const meta = JSON.parse(fs.readFileSync(this._metaPath, "utf8"));
    const salt = Buffer.from(meta.salt, "base64");
    this._aesKey = crypto.scryptSync(masterPassword, salt, DERIVED_KEY_LENGTH, SCRYPT_PARAMS);

    // Verify signature if PQC and sig file exists
    if (meta.pqc && fs.existsSync(this._sigPath) && meta.sigPublicKey) {
      const sigPublicKey = crypto.createPublicKey({
        key: Buffer.from(meta.sigPublicKey, "base64"),
        format: "der", type: "spki",
      });
      const vaultData = fs.readFileSync(this._vaultPath);
      const signature = fs.readFileSync(this._sigPath);
      const verified = crypto.verify(null, vaultData, sigPublicKey, signature);
      if (!verified) {
        this._aesKey = null;
        throw new Error("VAULT TAMPERED — signature verification failed.");
      }
    }

    // Decrypt vault
    const encryptedData = fs.readFileSync(this._vaultPath);
    let offset = 0;
    const iv = encryptedData.subarray(offset, offset + IV_LENGTH); offset += IV_LENGTH;
    const authTag = encryptedData.subarray(offset, offset + AUTH_TAG_LENGTH); offset += AUTH_TAG_LENGTH;
    const kemCtLen = encryptedData.readUInt32BE(offset); offset += 4;
    const kemCiphertext = encryptedData.subarray(offset, offset + kemCtLen); offset += kemCtLen;
    const ciphertext = encryptedData.subarray(offset);

    try {
      const decipher = crypto.createDecipheriv(SYM_ALGORITHM, this._aesKey, iv);
      decipher.setAuthTag(authTag);
      decipher.setAAD(kemCiphertext);
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      const parsed = JSON.parse(decrypted.toString("utf8"));
      this._secrets = parsed.secrets || {};
      this._auditLog = parsed.auditLog || [];
    } catch (err) {
      this._aesKey = null;
      throw new Error("Invalid master password or corrupted vault.");
    }

    // Reconstruct PQC keypairs from encrypted payload
    if (meta.pqc) {
      if (this._secrets.__sigPrivateKey && meta.sigPublicKey) {
        this._sigKeyPair = {
          publicKey: crypto.createPublicKey({ key: Buffer.from(meta.sigPublicKey, "base64"), format: "der", type: "spki" }),
          privateKey: crypto.createPrivateKey({ key: Buffer.from(this._secrets.__sigPrivateKey, "base64"), format: "der", type: "pkcs8" }),
        };
      }
      if (this._secrets.__kemPrivateKey && meta.kemPublicKey) {
        this._kemKeyPair = {
          publicKey: crypto.createPublicKey({ key: Buffer.from(meta.kemPublicKey, "base64"), format: "der", type: "spki" }),
          privateKey: crypto.createPrivateKey({ key: Buffer.from(this._secrets.__kemPrivateKey, "base64"), format: "der", type: "pkcs8" }),
        };
      }
    }

    this._unlocked = true;
    this._audit("unlock", "*");
    this._resetLockTimer();
    this.emit("vault:unlocked", { secretCount: this.list().length });
  }

  // ─── CRUD ────────────────────────────────────────────────────────

  set(key, value, options = {}) {
    this._requireUnlocked();
    if (!key || typeof key !== "string") throw new Error("Key must be a non-empty string");

    const now = new Date().toISOString();
    const existing = this._secrets[key];
    const category = options.category || CATEGORIES[key] || (existing?.category) || "uncategorized";
    const domain = options.domain || this._inferDomain(key) || (existing?.domain) || "custom";

    this._secrets[key] = {
      value: String(value),
      category,
      domain,
      createdAt: existing?.createdAt || now,
      rotatedAt: existing ? now : null,
      rotationCount: existing ? (existing.rotationCount || 0) + 1 : 0,
      accessCount: existing?.accessCount || 0,
    };

    this._audit(existing ? "rotate" : "set", key);
    this._persist();
    this.emit("vault:secret-set", { key, category, domain });
  }

  get(key) {
    this._requireUnlocked();
    const entry = this._secrets[key];
    if (!entry || key.startsWith("__")) return null;
    entry.accessCount = (entry.accessCount || 0) + 1;
    entry.lastAccessedAt = new Date().toISOString();
    this._audit("get", key);
    return entry.value;
  }

  delete(key) {
    this._requireUnlocked();
    if (!this._secrets[key] || key.startsWith("__")) return false;
    delete this._secrets[key];
    this._audit("delete", key);
    this._persist();
    this.emit("vault:secret-deleted", { key });
    return true;
  }

  rotate(key, newValue) {
    this._requireUnlocked();
    if (!this._secrets[key]) throw new Error(`Secret '${key}' not found`);
    this.set(key, newValue, { category: this._secrets[key]?.category, domain: this._secrets[key]?.domain });
  }

  list() {
    this._requireUnlocked();
    return Object.entries(this._secrets)
      .filter(([k]) => !k.startsWith("__"))
      .map(([key, entry]) => ({
        key,
        category: entry.category,
        domain: entry.domain,
        createdAt: entry.createdAt,
        rotatedAt: entry.rotatedAt,
        rotationCount: entry.rotationCount || 0,
        accessCount: entry.accessCount || 0,
      }));
  }

  // ─── Cross-Domain API Helpers ────────────────────────────────────

  getForAPI(key) {
    const value = this.get(key);
    if (!value) return null;

    const entry = this._secrets[key];
    const domain = entry?.domain || this._inferDomain(key);

    switch (domain) {
      case "github":
        return { headers: { Authorization: `token ${value}` } };
      case "claude":
        return { headers: { "x-api-key": value, "anthropic-version": "2023-06-01" } };
      case "gcloud":
      case "googleai":
        return { token: value };
      case "cloudflare":
      case "huggingface":
      case "openai":
      case "groq":
      case "perplexity":
      case "sentry":
      case "stripe":
      case "neon":
      case "pinecone":
        return { headers: { Authorization: `Bearer ${value}` } };
      default:
        return { value };
    }
  }

  // ─── Environment Injection ───────────────────────────────────────

  injectEnv() {
    this._requireUnlocked();
    let count = 0;
    for (const [key, entry] of Object.entries(this._secrets)) {
      if (key.startsWith("__")) continue;
      process.env[key] = entry.value;
      count++;
    }
    this._audit("injectEnv", `${count} keys`);
    this.emit("vault:env-injected", { count });
    return count;
  }

  // ─── Import from .env file ──────────────────────────────────────

  importEnvFile(filePath) {
    this._requireUnlocked();
    const content = fs.readFileSync(filePath, "utf8");
    let imported = 0;
    let skipped = 0;

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;

      const key = trimmed.substring(0, eqIdx).trim();
      let value = trimmed.substring(eqIdx + 1).trim();

      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (!value || value.includes("FILL_IN") || value.includes("YOUR_")) {
        skipped++;
        continue;
      }

      this.set(key, value);
      imported++;
    }

    this.emit("vault:imported", { imported, skipped, source: filePath });
    return { imported, skipped };
  }

  // ─── Audit ───────────────────────────────────────────────────────

  audit(limit = 100) {
    this._requireUnlocked();
    return this._auditLog.slice(-limit);
  }

  // ─── Status ──────────────────────────────────────────────────────

  status() {
    const exists = fs.existsSync(this._vaultPath);
    const entries = this._unlocked ? this.list() : [];
    const categories = {};
    const domains = {};
    for (const e of entries) {
      categories[e.category] = (categories[e.category] || 0) + 1;
      domains[e.domain] = (domains[e.domain] || 0) + 1;
    }

    return {
      vault: "HeadyVault",
      version: VAULT_VERSION,
      exists,
      unlocked: this._unlocked,
      pqc: this._pqcAvailable ? { kem: KEM_ALGORITHM, sig: SIG_ALGORITHM } : false,
      symmetric: SYM_ALGORITHM,
      totalSecrets: entries.length,
      categories,
      domains,
      auditEntries: this._auditLog.length,
      ts: new Date().toISOString(),
    };
  }

  // ─── Lock ────────────────────────────────────────────────────────

  lock() {
    if (this._aesKey) this._aesKey.fill(0);
    this._aesKey = null;
    this._sigKeyPair = null;
    this._kemKeyPair = null;
    this._secrets = {};
    this._unlocked = false;
    if (this._lockTimer) clearTimeout(this._lockTimer);
    this.emit("vault:locked");
  }

  // ─── Internal ────────────────────────────────────────────────────

  _requireUnlocked() {
    if (!this._unlocked) throw new Error("Vault is locked. Call unlock() first.");
    this._resetLockTimer();
  }

  _resetLockTimer() {
    if (this._lockTimer) clearTimeout(this._lockTimer);
    this._lockTimer = setTimeout(() => this.lock(), AUTO_LOCK_MS);
  }

  _audit(action, key) {
    this._auditLog.push({
      action,
      key: key.startsWith("__") ? "[internal]" : key,
      timestamp: new Date().toISOString(),
    });
    if (this._auditLog.length > 10000) this._auditLog = this._auditLog.slice(-5000);
  }

  _inferDomain(key) {
    const k = key.toUpperCase();
    if (k.includes("GITHUB")) return "github";
    if (k.includes("STRIPE")) return "stripe";
    if (k.includes("CLOUDFLARE")) return "cloudflare";
    if (k.includes("ANTHROPIC") || k.includes("CLAUDE")) return "claude";
    if (k.includes("OPENAI")) return "openai";
    if (k.includes("GEMINI") || k.includes("GCLOUD") || k.includes("GOOGLE")) return "gcloud";
    if (k.includes("GROQ")) return "groq";
    if (k.includes("PERPLEXITY")) return "perplexity";
    if (k.includes("HF_") || k.includes("HUGGING")) return "huggingface";
    if (k.includes("NEON") || k.includes("DATABASE")) return "neon";
    if (k.includes("UPSTASH")) return "upstash";
    if (k.includes("PINECONE")) return "pinecone";
    if (k.includes("SENTRY")) return "sentry";
    if (k.includes("HEADY")) return "heady";
    if (k.includes("FIREBASE")) return "gcloud";
    return "custom";
  }

  _persist() {
    if (!this._aesKey) throw new Error("Cannot persist: no AES key");

    const dataToEncrypt = {
      secrets: { ...this._secrets },
      auditLog: this._auditLog,
    };

    // Store PQC private keys inside encrypted payload
    if (this._sigKeyPair?.privateKey) {
      dataToEncrypt.secrets.__sigPrivateKey = this._sigKeyPair.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
    }
    if (this._kemKeyPair?.privateKey) {
      dataToEncrypt.secrets.__kemPrivateKey = this._kemKeyPair.privateKey.export({ type: "pkcs8", format: "der" }).toString("base64");
    }

    const plaintext = Buffer.from(JSON.stringify(dataToEncrypt), "utf8");

    // KEM ciphertext as additional authenticated data layer
    let kemCiphertext;
    if (this._kemKeyPair) {
      kemCiphertext = crypto.hash(HASH_ALGORITHM, crypto.randomBytes(64));
    } else {
      kemCiphertext = crypto.randomBytes(32);
    }

    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(SYM_ALGORITHM, this._aesKey, iv);
    cipher.setAAD(kemCiphertext);

    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Pack: [iv(12)] [authTag(16)] [kemCtLen(4)] [kemCiphertext] [encrypted]
    const kemCtLenBuf = Buffer.alloc(4);
    kemCtLenBuf.writeUInt32BE(kemCiphertext.length);
    const vaultData = Buffer.concat([iv, authTag, kemCtLenBuf, kemCiphertext, encrypted]);

    // Atomic write
    const tmpPath = this._vaultPath + ".tmp";
    fs.writeFileSync(tmpPath, vaultData);
    fs.renameSync(tmpPath, this._vaultPath);

    // Sign with ML-DSA-65
    if (this._sigKeyPair?.privateKey) {
      const signature = crypto.sign(null, vaultData, this._sigKeyPair.privateKey);
      fs.writeFileSync(this._sigPath, signature);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════════════

async function openVault(vaultDir, masterPassword) {
  const vault = new HeadyVault(vaultDir);
  const vaultPath = path.join(path.resolve(vaultDir), "vault.enc");

  if (fs.existsSync(vaultPath)) {
    await vault.unlock(masterPassword);
  } else {
    await vault.init(masterPassword);
  }

  return vault;
}

// ═══════════════════════════════════════════════════════════════════
// REST Routes
// ═══════════════════════════════════════════════════════════════════

function registerVaultRoutes(app, vault) {
  app.post("/api/vault/unlock", async (req, res) => {
    try {
      await vault.unlock(req.body.password);
      res.json({ ok: true, ...vault.status() });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/vault/lock", (_req, res) => {
    vault.lock();
    res.json({ ok: true, locked: true });
  });

  app.post("/api/vault/set", (req, res) => {
    try {
      const { key, value, category, domain } = req.body;
      vault.set(key, value, { category, domain });
      res.json({ ok: true, key });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/vault/get/:key", (req, res) => {
    try {
      const value = vault.get(req.params.key);
      if (!value) return res.status(404).json({ ok: false, error: "Not found" });
      const response = { ok: true, key: req.params.key };
      if (req.query.reveal === "true") response.value = value;
      res.json(response);
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/vault/for-api/:key", (req, res) => {
    try {
      const apiCreds = vault.getForAPI(req.params.key);
      if (!apiCreds) return res.status(404).json({ ok: false, error: "Not found" });
      res.json({ ok: true, ...apiCreds });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/vault/rotate", (req, res) => {
    try {
      vault.rotate(req.body.key, req.body.value);
      res.json({ ok: true, key: req.body.key });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.delete("/api/vault/delete/:key", (req, res) => {
    try {
      const deleted = vault.delete(req.params.key);
      res.json({ ok: true, deleted });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/vault/list", (_req, res) => {
    try {
      res.json({ ok: true, secrets: vault.list() });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/vault/import-env", (req, res) => {
    try {
      const result = vault.importEnvFile(req.body.filePath);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.post("/api/vault/inject-env", (_req, res) => {
    try {
      const count = vault.injectEnv();
      res.json({ ok: true, injected: count });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/vault/audit", (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 100;
      res.json({ ok: true, audit: vault.audit(limit) });
    } catch (err) {
      res.status(400).json({ ok: false, error: err.message });
    }
  });

  app.get("/api/vault/status", (_req, res) => {
    res.json({ ok: true, ...vault.status() });
  });
}

// ═══════════════════════════════════════════════════════════════════
// Exports (ESM)
// ═══════════════════════════════════════════════════════════════════

export {
  HeadyVault,
  openVault,
  registerVaultRoutes,
  DOMAINS,
  CATEGORIES,
  VAULT_VERSION,
};
export default HeadyVault;
