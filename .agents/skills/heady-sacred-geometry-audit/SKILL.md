---
name: heady-sacred-geometry-audit
description: Automated audit procedures for verifying Sacred Geometry compliance across the entire codebase
---

# Sacred Geometry Audit Skill

## Overview
This skill provides automated procedures for auditing HeadyOS compliance with Sacred Geometry principles. All agents should run these checks before approving code changes.

## Sacred Rules Quick Reference

| # | Rule | Check |
|---|------|-------|
| 1 | **NO LOCALHOST** | `grep -r 'localhost' --include='*.js'` — only acceptable in Docker HEALTHCHECK, security validators, dev console.log |
| 2 | **φ-scaled constants** | All timeouts, intervals, cache sizes, retries must derive from φ or Fibonacci |
| 3 | **CommonJS only** | `.js` files use `require()`/`module.exports`, never `import`/`export` |
| 4 | **Brand headers** | All key files start with `// HEADY_BRAND:BEGIN` block |
| 5 | **Zero-trust CORS** | No `Access-Control-Allow-Origin: *` in application code |
| 6 | **Fail-closed** | Unregistered pipeline tasks throw errors, never fake success |
| 7 | **fib(8)=21 stages** | Pipeline must have exactly 21 stages |

## Audit Procedures

### 1. Localhost Scan
```bash
# Find violations (exclude acceptable uses)
grep -rn 'localhost' --include='*.js' --include='*.ts' \
  | grep -v 'docker-compose' \
  | grep -v 'HEALTHCHECK' \
  | grep -v '// localhost' \
  | grep -v 'node_modules'
```

**Acceptable uses:** Docker health checks (container-internal), security validators that detect/block localhost, `process.env.X || 'localhost'` with env override, console.log display strings, domain router dev entries.

**Violations:** Hardcoded `http://localhost:PORT` in service URLs, health check targets, API endpoints.

### 2. Round Number Scan
```bash
# Find suspicious round numbers
grep -rn '[0-9]\{4,\}' --include='*.js' src/ \
  | grep -E '(1000|2000|3000|5000|10000|30000|60000|3600)' \
  | grep -v 'node_modules'
```

**Expected φ-derived values:**
- 1618 (φ × 1000)
- 2618 (φ² × 1000)
- 4236 (φ³ × 1000)
- 6854 (φ⁴ × 1000)
- 29034 (φ⁷ × 1000)

**Fibonacci values:** 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610

### 3. CORS Wildcard Scan
```bash
grep -rn "Access-Control-Allow-Origin.*\*" --include='*.js' src/ services/
grep -rn "origin.*['\"]\\*['\"]" --include='*.js' src/ services/
```

### 4. Pipeline Stage Count
```javascript
const yaml = require('js-yaml');
const config = yaml.load(fs.readFileSync('configs/hcfullpipeline.yaml'));
console.assert(config.pipeline.stages.length === 21, 'Stage count must be fib(8)=21');
```

### 5. Fail-Closed Verification
```bash
grep -n 'FAIL-CLOSED' src/hc_pipeline.js
# Must find the throw statement in executeTask()
```

### 6. Brand Header Check
```bash
# Key files that must have HEADY_BRAND headers
for f in heady-manager.js src/hc_pipeline.js src/hc_pipeline_handlers.js; do
  head -1 "$f" | grep -q 'HEADY_BRAND' || echo "MISSING: $f"
done
```

## Auto-Success Engine Integration
The auto-success engine already runs these checks continuously:
- **CodeQuality** category: line counts, CommonJS compliance, brand headers
- **Security** category: CORS wildcards, localhost in configs
- **Evolution** category: stage count, receipt deps, FAST path
- **Audit verification tasks**: 5 dedicated `audit_verify_*` pipeline tasks

## When to Run
- Before every commit (pre-commit hook)
- During every auto-success engine cycle (automatic)
- Before deploying to Cloud Run
- After merging remote changes
- When adding new services or config files
