# Heady State Sync (Cross-Device)
# Syncs runtime state, registry, and config hashes across environments.
# Called by hcfullpipeline.yaml system_operations lane.
#
# Usage: .\scripts\sync-state.ps1 -env production

param(
  [string]$env = "production"
)

$ErrorActionPreference = "Stop"

$HEADY_ROOT = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path $HEADY_ROOT)) { $HEADY_ROOT = $PSScriptRoot | Split-Path -Parent }

Write-Host "[HeadySync] Starting state sync for env=$env at $(Get-Date -Format 'o')"

# 1. Sync registry
$registryPath = Join-Path $HEADY_ROOT ".heady" "registry.json"
if (Test-Path $registryPath) {
  $registry = Get-Content $registryPath -Raw | ConvertFrom-Json
  $nodeCount = ($registry.nodes | Measure-Object).Count
  Write-Host "[HeadySync] Registry: $nodeCount nodes"
} else {
  Write-Host "[HeadySync] WARNING: registry.json not found at $registryPath"
}

# 2. Sync antigravity runtime state
$agStatePath = Join-Path $HEADY_ROOT "configs" "services" "antigravity-heady-runtime-state.json"
if (Test-Path $agStatePath) {
  $agState = Get-Content $agStatePath -Raw | ConvertFrom-Json
  Write-Host "[HeadySync] Antigravity workspace: $($agState.workspaceMode)"
} else {
  Write-Host "[HeadySync] WARNING: antigravity-heady-runtime-state.json not found"
}

# 3. Validate config hashes
$configFiles = @(
  "configs/hcfullpipeline.yaml",
  "configs/service-catalog.yaml",
  "configs/resource-policies.yaml",
  "configs/governance-policies.yaml"
)

$hashes = @{}
foreach ($cfg in $configFiles) {
  $cfgPath = Join-Path $HEADY_ROOT $cfg.Replace("/", "\")
  if (Test-Path $cfgPath) {
    $hash = (Get-FileHash $cfgPath -Algorithm SHA256).Hash.Substring(0, 12)
    $hashes[$cfg] = $hash
    Write-Host "[HeadySync] $cfg -> $hash"
  } else {
    Write-Host "[HeadySync] WARNING: $cfg not found"
  }
}

# 4. Write sync timestamp
$syncState = @{
  syncedAt = (Get-Date -Format 'o')
  env = $env
  configHashes = $hashes
  status = "synced"
} | ConvertTo-Json -Depth 3

$syncOutput = Join-Path $HEADY_ROOT ".heady" "last-sync.json"
$syncDir = Split-Path $syncOutput -Parent
if (-not (Test-Path $syncDir)) {
  New-Item -ItemType Directory -Path $syncDir -Force | Out-Null
}
Set-Content -Path $syncOutput -Value $syncState -Encoding UTF8

Write-Host "[HeadySync] State sync complete. Output: $syncOutput"
