# ─────────────────────────────────────────────────────────────────────────────
# Heady™ Consul Service Discovery Configuration
# Founded by Eric Haywood — HeadySystems Inc.
#
# ALL numeric constants from Fibonacci:
#   FIB = [1,1,2,3,5,8,13,21,34,55,89,144,233,377,610,987,1597,2584,4181,6765]
#   Health check intervals: FIB[8] = 34 seconds
#   Deregister timeout: FIB[10] = 89 seconds
#
# CSL domain tags for service topology:
#   inference, memory, agents, orchestration, security,
#   monitoring, web, data, integration, specialized
#
# GCP Project: gen-lang-client-0920560496
# Region: us-east1
# Cloudflare Account: 8b1fa38f282c691423c6399247d53323
# ─────────────────────────────────────────────────────────────────────────────

datacenter = "us-east1"
data_dir   = "/consul/data"
log_level  = "INFO"

server           = true
bootstrap_expect = 1

bind_addr   = "0.0.0.0"
client_addr = "0.0.0.0"

ui_config {
  enabled = true
}

performance {
  raft_multiplier = 5                     # FIB[4]
}

dns_config {
  allow_stale = true
  max_stale   = "5s"                      # FIB[4]
  node_ttl    = "34s"                     # FIB[8]
  service_ttl {
    "*" = "21s"                           # FIB[7]
  }
}

telemetry {
  prometheus_retention_time = "55s"       # FIB[9]
  disable_hostname          = true
}

connect {
  enabled = true
}

acl {
  enabled                  = true
  default_policy           = "deny"
  enable_token_persistence = true
  tokens {
    initial_management = "CONSUL_MANAGEMENT_TOKEN"
  }
}

# ═══════════════════════════════════════════════════════════════════════════════
# SERVICE DEFINITIONS — ALL 50 HEADY SERVICES
# Grouped by CSL domain with health checks at FIB[8]=34s intervals
# ═══════════════════════════════════════════════════════════════════════════════

# ─── Inference Domain (ports 3310–3317) ──────────────────────────────────────

services {
  id = "heady-soul"
  name = "heady-soul"
  port = 3310
  tags = ["inference", "central", "phi", "heady", "Eric-Haywood"]
  meta { domain = "inference"; ring = "central"; founder = "Eric Haywood"; phi = "1.6180339887498948" }
  check { http = "http://heady-soul:3310/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "heady-brains"
  name = "heady-brains"
  port = 3311
  tags = ["inference", "inner", "heady"]
  meta { domain = "inference"; ring = "inner" }
  check { http = "http://heady-brains:3311/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "heady-conductor"
  name = "heady-conductor"
  port = 3312
  tags = ["inference", "inner", "heady"]
  meta { domain = "inference"; ring = "inner" }
  check { http = "http://heady-conductor:3312/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "heady-vinci"
  name = "heady-vinci"
  port = 3313
  tags = ["inference", "inner", "heady"]
  meta { domain = "inference"; ring = "inner" }
  check { http = "http://heady-vinci:3313/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "llm-router"
  name = "llm-router"
  port = 3314
  tags = ["inference", "inner", "routing", "heady"]
  meta { domain = "inference"; ring = "inner" }
  check { http = "http://llm-router:3314/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "embedding-router"
  name = "embedding-router"
  port = 3315
  tags = ["inference", "inner", "routing", "heady"]
  meta { domain = "inference"; ring = "inner" }
  check { http = "http://embedding-router:3315/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "moe-csl-router"
  name = "moe-csl-router"
  port = 3316
  tags = ["inference", "inner", "routing", "csl", "heady"]
  meta { domain = "inference"; ring = "inner" }
  check { http = "http://moe-csl-router:3316/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "prompt-executor"
  name = "prompt-executor"
  port = 3317
  tags = ["inference", "inner", "deterministic", "heady"]
  meta { domain = "inference"; ring = "inner" }
  check { http = "http://prompt-executor:3317/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Memory Domain (ports 3318–3323) ────────────────────────────────────────

services {
  id = "vector-memory"; name = "vector-memory"; port = 3318
  tags = ["memory", "middle", "heady"]
  meta { domain = "memory"; ring = "middle" }
  check { http = "http://vector-memory:3318/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "graph-rag"; name = "graph-rag"; port = 3319
  tags = ["memory", "middle", "rag", "heady"]
  meta { domain = "memory"; ring = "middle" }
  check { http = "http://graph-rag:3319/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "hybrid-search"; name = "hybrid-search"; port = 3320
  tags = ["memory", "middle", "search", "heady"]
  meta { domain = "memory"; ring = "middle" }
  check { http = "http://hybrid-search:3320/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "context-window"; name = "context-window"; port = 3321
  tags = ["memory", "middle", "heady"]
  meta { domain = "memory"; ring = "middle" }
  check { http = "http://context-window:3321/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "durable-state"; name = "durable-state"; port = 3322
  tags = ["memory", "middle", "state", "heady"]
  meta { domain = "memory"; ring = "middle" }
  check { http = "http://durable-state:3322/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "pattern-store"; name = "pattern-store"; port = 3323
  tags = ["memory", "middle", "patterns", "heady"]
  meta { domain = "memory"; ring = "middle" }
  check { http = "http://pattern-store:3323/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Agents Domain (ports 3324–3331) ────────────────────────────────────────

services {
  id = "bee-factory"; name = "bee-factory"; port = 3324
  tags = ["agents", "middle", "factory", "heady"]
  meta { domain = "agents"; ring = "middle" }
  check { http = "http://bee-factory:3324/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "swarm-coordinator"; name = "swarm-coordinator"; port = 3325
  tags = ["agents", "middle", "swarm", "heady"]
  meta { domain = "agents"; ring = "middle" }
  check { http = "http://swarm-coordinator:3325/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "jules-agent"; name = "jules-agent"; port = 3326
  tags = ["agents", "middle", "jules", "heady"]
  meta { domain = "agents"; ring = "middle" }
  check { http = "http://jules-agent:3326/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "builder-agent"; name = "builder-agent"; port = 3327
  tags = ["agents", "middle", "builder", "heady"]
  meta { domain = "agents"; ring = "middle" }
  check { http = "http://builder-agent:3327/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "observer-agent"; name = "observer-agent"; port = 3328
  tags = ["agents", "middle", "observer", "heady"]
  meta { domain = "agents"; ring = "middle" }
  check { http = "http://observer-agent:3328/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "murphy-agent"; name = "murphy-agent"; port = 3329
  tags = ["agents", "middle", "murphy", "heady"]
  meta { domain = "agents"; ring = "middle" }
  check { http = "http://murphy-agent:3329/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "atlas-agent"; name = "atlas-agent"; port = 3330
  tags = ["agents", "middle", "atlas", "heady"]
  meta { domain = "agents"; ring = "middle" }
  check { http = "http://atlas-agent:3330/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "pythia-agent"; name = "pythia-agent"; port = 3331
  tags = ["agents", "middle", "pythia", "heady"]
  meta { domain = "agents"; ring = "middle" }
  check { http = "http://pythia-agent:3331/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Orchestration Domain (ports 3332–3338) ─────────────────────────────────

services {
  id = "task-decomposition"; name = "task-decomposition"; port = 3332
  tags = ["orchestration", "inner", "heady"]
  meta { domain = "orchestration"; ring = "inner" }
  check { http = "http://task-decomposition:3332/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "liquid-gateway"; name = "liquid-gateway"; port = 3333
  tags = ["orchestration", "inner", "gateway", "heady"]
  meta { domain = "orchestration"; ring = "inner" }
  check { http = "http://liquid-gateway:3333/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "backpressure"; name = "backpressure"; port = 3334
  tags = ["orchestration", "middle", "heady"]
  meta { domain = "orchestration"; ring = "middle" }
  check { http = "http://backpressure:3334/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "hcfp-runner"; name = "hcfp-runner"; port = 3335
  tags = ["orchestration", "inner", "pipeline", "heady"]
  meta { domain = "orchestration"; ring = "inner" }
  check { http = "http://hcfp-runner:3335/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "arena-engine"; name = "arena-engine"; port = 3336
  tags = ["orchestration", "middle", "arena", "heady"]
  meta { domain = "orchestration"; ring = "middle" }
  check { http = "http://arena-engine:3336/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "socratic-loop"; name = "socratic-loop"; port = 3337
  tags = ["orchestration", "middle", "socratic", "heady"]
  meta { domain = "orchestration"; ring = "middle" }
  check { http = "http://socratic-loop:3337/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "monte-carlo"; name = "monte-carlo"; port = 3338
  tags = ["orchestration", "middle", "monte-carlo", "heady"]
  meta { domain = "orchestration"; ring = "middle" }
  check { http = "http://monte-carlo:3338/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Security Domain (ports 3339–3345) ──────────────────────────────────────

services {
  id = "security-gate"; name = "security-gate"; port = 3339
  tags = ["security", "governance", "gate", "heady"]
  meta { domain = "security"; ring = "governance" }
  check { http = "http://security-gate:3339/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "zero-trust"; name = "zero-trust"; port = 3340
  tags = ["security", "governance", "zero-trust", "heady"]
  meta { domain = "security"; ring = "governance" }
  check { http = "http://zero-trust:3340/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "heady-check"; name = "heady-check"; port = 3341
  tags = ["security", "governance", "quality", "heady"]
  meta { domain = "security"; ring = "governance" }
  check { http = "http://heady-check:3341/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "heady-assure"; name = "heady-assure"; port = 3342
  tags = ["security", "governance", "assurance", "heady"]
  meta { domain = "security"; ring = "governance" }
  check { http = "http://heady-assure:3342/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "heady-aware"; name = "heady-aware"; port = 3343
  tags = ["security", "governance", "awareness", "heady"]
  meta { domain = "security"; ring = "governance" }
  check { http = "http://heady-aware:3343/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "heady-risk"; name = "heady-risk"; port = 3344
  tags = ["security", "governance", "risk", "heady"]
  meta { domain = "security"; ring = "governance" }
  check { http = "http://heady-risk:3344/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "heady-mc"; name = "heady-mc"; port = 3345
  tags = ["security", "governance", "mission-control", "heady"]
  meta { domain = "security"; ring = "governance" }
  check { http = "http://heady-mc:3345/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Monitoring Domain (ports 3346–3349) ────────────────────────────────────

services {
  id = "heady-patterns"; name = "heady-patterns"; port = 3346
  tags = ["monitoring", "governance", "patterns", "heady"]
  meta { domain = "monitoring"; ring = "governance" }
  check { http = "http://heady-patterns:3346/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "circuit-breaker"; name = "circuit-breaker"; port = 3347
  tags = ["monitoring", "middle", "resilience", "heady"]
  meta { domain = "monitoring"; ring = "middle" }
  check { http = "http://circuit-breaker:3347/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "self-healing"; name = "self-healing"; port = 3348
  tags = ["monitoring", "middle", "healing", "heady"]
  meta { domain = "monitoring"; ring = "middle" }
  check { http = "http://self-healing:3348/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "phi-backoff"; name = "phi-backoff"; port = 3349
  tags = ["monitoring", "middle", "backoff", "heady"]
  meta { domain = "monitoring"; ring = "middle" }
  check { http = "http://phi-backoff:3349/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Web Domain (ports 3350–3358) ───────────────────────────────────────────

services {
  id = "web-headyme"; name = "web-headyme"; port = 3350
  tags = ["web", "outer", "headyme.com", "heady"]
  meta { domain = "web"; ring = "outer"; website = "headyme.com" }
  check { http = "http://web-headyme:3350/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "web-headysystems"; name = "web-headysystems"; port = 3351
  tags = ["web", "outer", "headysystems.com", "heady"]
  meta { domain = "web"; ring = "outer"; website = "headysystems.com" }
  check { http = "http://web-headysystems:3351/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "web-heady-ai"; name = "web-heady-ai"; port = 3352
  tags = ["web", "outer", "heady-ai.com", "heady"]
  meta { domain = "web"; ring = "outer"; website = "heady-ai.com" }
  check { http = "http://web-heady-ai:3352/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "web-headyos"; name = "web-headyos"; port = 3353
  tags = ["web", "outer", "headyos.com", "heady"]
  meta { domain = "web"; ring = "outer"; website = "headyos.com" }
  check { http = "http://web-headyos:3353/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "web-connection-org"; name = "web-connection-org"; port = 3354
  tags = ["web", "outer", "headyconnection.org", "nonprofit", "heady"]
  meta { domain = "web"; ring = "outer"; website = "headyconnection.org" }
  check { http = "http://web-connection-org:3354/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "web-connection-com"; name = "web-connection-com"; port = 3355
  tags = ["web", "outer", "headyconnection.com", "community", "heady"]
  meta { domain = "web"; ring = "outer"; website = "headyconnection.com" }
  check { http = "http://web-connection-com:3355/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "web-headyex"; name = "web-headyex"; port = 3356
  tags = ["web", "outer", "headyex.com", "exchange", "heady"]
  meta { domain = "web"; ring = "outer"; website = "headyex.com" }
  check { http = "http://web-headyex:3356/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "web-headyfinance"; name = "web-headyfinance"; port = 3357
  tags = ["web", "outer", "headyfinance.com", "finance", "heady"]
  meta { domain = "web"; ring = "outer"; website = "headyfinance.com" }
  check { http = "http://web-headyfinance:3357/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "web-admin"; name = "web-admin"; port = 3358
  tags = ["web", "outer", "admin.headysystems.com", "admin", "heady"]
  meta { domain = "web"; ring = "outer"; website = "admin.headysystems.com" }
  check { http = "http://web-admin:3358/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Data Domain (ports 3359–3362) ──────────────────────────────────────────

services {
  id = "edge-origin-router"; name = "edge-origin-router"; port = 3359
  tags = ["data", "outer", "edge", "heady"]
  meta { domain = "data"; ring = "outer" }
  check { http = "http://edge-origin-router:3359/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "audit-logger"; name = "audit-logger"; port = 3360
  tags = ["data", "governance", "audit", "heady"]
  meta { domain = "data"; ring = "governance" }
  check { http = "http://audit-logger:3360/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "rate-limiter"; name = "rate-limiter"; port = 3361
  tags = ["data", "governance", "rate-limit", "heady"]
  meta { domain = "data"; ring = "governance" }
  check { http = "http://rate-limiter:3361/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "mcp-gateway"; name = "mcp-gateway"; port = 3362
  tags = ["data", "middle", "mcp", "heady"]
  meta { domain = "data"; ring = "middle" }
  check { http = "http://mcp-gateway:3362/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Integration Domain (ports 3363–3367) ───────────────────────────────────

services {
  id = "bridge-agent"; name = "bridge-agent"; port = 3363
  tags = ["integration", "outer", "bridge", "heady"]
  meta { domain = "integration"; ring = "outer" }
  check { http = "http://bridge-agent:3363/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "muse-agent"; name = "muse-agent"; port = 3364
  tags = ["integration", "outer", "muse", "heady"]
  meta { domain = "integration"; ring = "outer" }
  check { http = "http://muse-agent:3364/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "sentinel-agent"; name = "sentinel-agent"; port = 3365
  tags = ["integration", "outer", "sentinel", "heady"]
  meta { domain = "integration"; ring = "outer" }
  check { http = "http://sentinel-agent:3365/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "nova-agent"; name = "nova-agent"; port = 3366
  tags = ["integration", "outer", "nova", "heady"]
  meta { domain = "integration"; ring = "outer" }
  check { http = "http://nova-agent:3366/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "janitor-agent"; name = "janitor-agent"; port = 3367
  tags = ["integration", "outer", "janitor", "heady"]
  meta { domain = "integration"; ring = "outer" }
  check { http = "http://janitor-agent:3367/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

# ─── Specialized Domain (ports 3368–3372) ───────────────────────────────────

services {
  id = "generative-ui"; name = "generative-ui"; port = 3368
  tags = ["specialized", "outer", "ui", "heady"]
  meta { domain = "specialized"; ring = "outer" }
  check { http = "http://generative-ui:3368/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "patent-registry"; name = "patent-registry"; port = 3369
  tags = ["specialized", "outer", "patent", "heady"]
  meta { domain = "specialized"; ring = "outer" }
  check { http = "http://patent-registry:3369/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "sophia-agent"; name = "sophia-agent"; port = 3370
  tags = ["specialized", "outer", "sophia", "heady"]
  meta { domain = "specialized"; ring = "outer" }
  check { http = "http://sophia-agent:3370/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "cipher-agent"; name = "cipher-agent"; port = 3371
  tags = ["specialized", "outer", "cipher", "heady"]
  meta { domain = "specialized"; ring = "outer" }
  check { http = "http://cipher-agent:3371/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}

services {
  id = "lens-agent"; name = "lens-agent"; port = 3372
  tags = ["specialized", "outer", "lens", "heady"]
  meta { domain = "specialized"; ring = "outer" }
  check { http = "http://lens-agent:3372/health"; interval = "34s"; timeout = "8s"; deregister_critical_service_after = "89s" }
}
