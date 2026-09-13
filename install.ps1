# cc_profile installer
#
# Usage:
#   irm https://raw.githubusercontent.com/kyungjin830613-code/cc_profile/main/install.ps1 | iex
#
# Downloads profile.ps1 from this repo and installs it as the current user's
# PowerShell profile ($PROFILE), backing up any existing profile first.

$ErrorActionPreference = "Stop"

$repoRawBase = "https://raw.githubusercontent.com/kyungjin830613-code/cc_profile/main"
$profileUrl = "$repoRawBase/profile.ps1"

Write-Host "Installing cc_profile..." -ForegroundColor Cyan

# Ensure the profile directory exists.
$profileDir = Split-Path -Parent $PROFILE
if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
}

# Back up an existing profile before overwriting it.
if (Test-Path $PROFILE) {
    $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
    $backupPath = "$PROFILE.bak-$timestamp"
    Copy-Item -Path $PROFILE -Destination $backupPath -Force
    Write-Host "Existing profile backed up to $backupPath" -ForegroundColor Yellow
}

# Download and write the new profile content.
try {
    $content = (Invoke-WebRequest -Uri $profileUrl -UseBasicParsing).Content
} catch {
    Write-Error "Failed to download profile from $profileUrl`: $_"
    exit 1
}

Set-Content -Path $PROFILE -Value $content -Encoding UTF8

Write-Host "cc_profile installed to $PROFILE" -ForegroundColor Green
Write-Host "Restart PowerShell, or run '. `$PROFILE' to load it now." -ForegroundColor Green
