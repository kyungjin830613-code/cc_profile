# cc_profile — a small, opinionated PowerShell profile.
# Installed by install.ps1 into $PROFILE. Safe to re-run install to update.

# --- Prompt: shows current path and git branch (if any) ---
function prompt {
    $path = (Get-Location).Path
    $branch = $null
    if (Get-Command git -ErrorAction SilentlyContinue) {
        $branch = git rev-parse --abbrev-ref HEAD 2>$null
    }
    $branchPart = if ($branch) { " (" + $branch + ")" } else { "" }
    Write-Host "PS " -NoNewline -ForegroundColor DarkGray
    Write-Host $path -NoNewline -ForegroundColor Cyan
    if ($branchPart) { Write-Host $branchPart -NoNewline -ForegroundColor Yellow }
    return "> "
}

# --- Navigation & listing ---
function ll { Get-ChildItem -Force @args }
function la { Get-ChildItem -Force -Hidden @args }
function .. { Set-Location .. }
function ... { Set-Location ..\.. }

# --- Git shortcuts ---
function gs { git status @args }
function ga { git add @args }
function gc { git commit @args }
function gp { git push @args }
function gl { git log --oneline --graph --decorate -n 20 @args }
function gd { git diff @args }
function gco { git checkout @args }

# --- Misc utilities ---
function which($name) {
    Get-Command $name -ErrorAction SilentlyContinue |
        Select-Object -ExpandProperty Source -ErrorAction SilentlyContinue
}

function touch($file) {
    if (Test-Path $file) {
        (Get-Item $file).LastWriteTime = Get-Date
    } else {
        New-Item -ItemType File -Path $file | Out-Null
    }
}

# --- Claude Code convenience alias ---
if (Get-Command claude -ErrorAction SilentlyContinue) {
    function cc { claude @args }
}
