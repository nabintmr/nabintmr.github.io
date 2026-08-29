<#
.SYNOPSIS
    Git sync for nabintmr.github.io — pull, verify, commit, push.

.DESCRIPTION
    Lean workflow for a static 6-page site (no search index, no knowledge
    graph, no version stamping). Steps:
    1. Pull remote updates with --autostash.
    2. Run scripts/verify.py (structural integrity: tag balance, link
       and asset integrity, CSS/JS syntax).
    3. Stage, commit (auto-message or -m), and push.

.PARAMETER Message
    Custom commit message (e.g. -m "fix(contact): correct WhatsApp number").
    If omitted, a simple message is generated from changed file names.

.PARAMETER PullOnly
    Pull remote changes with --autostash only; no commit or push.

.PARAMETER SkipVerify
    Bypass the verify.py gate (not recommended).

.EXAMPLE
    .\sync.ps1
.EXAMPLE
    .\sync.ps1 -m "content: update about page bio"
.EXAMPLE
    .\sync.ps1 -PullOnly
#>

param(
    [Alias("m")][string]$Message,
    [switch]$PullOnly,
    [switch]$SkipVerify
)

$ErrorActionPreference = "Stop"

function Write-Step($msg) { Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Err($msg)  { Write-Host "ERROR: $msg" -ForegroundColor Red }

# ── 1. Pull ─────────────────────────────────────────────────────────
Write-Step "Pulling remote changes (--autostash)..."
git pull --autostash origin main
if ($LASTEXITCODE -ne 0) {
    Write-Err "git pull failed. Resolve conflicts before continuing."
    exit 1
}

if ($PullOnly) {
    Write-Step "PullOnly mode — done."
    exit 0
}

# ── 2. Verify ───────────────────────────────────────────────────────
if (-not $SkipVerify) {
    Write-Step "Running verify.py..."
    python scripts/verify.py
    if ($LASTEXITCODE -eq 1) {
        Write-Err "verify.py found errors. Fix them before committing."
        exit 1
    }
} else {
    Write-Step "Skipping verify.py (-SkipVerify passed)"
}

# ── 3. Check for changes ────────────────────────────────────────────
$status = git status --porcelain
if (-not $status) {
    Write-Step "No changes to commit."
    exit 0
}

# ── 4. Commit message ──────────────────────────────────────────────
if (-not $Message) {
    $changed = git diff --name-only HEAD
    $staged  = git diff --name-only --cached
    $files   = ($changed + $staged | Select-Object -Unique) -join ", "
    if (-not $files) { $files = "site content" }
    $Message = "update: $files"
}

# ── 5. Stage, commit, push ──────────────────────────────────────────
Write-Step "Staging all changes..."
git add -A

Write-Step "Committing: $Message"
git commit -m "$Message"

Write-Step "Pushing to origin main..."
git push origin main

Write-Step "Done."