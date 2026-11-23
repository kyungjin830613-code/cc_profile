# cc_profile

A small, opinionated PowerShell profile: a git-aware prompt, common navigation
and git shortcuts, a couple of utility functions, and a `cc` alias for the
Claude Code CLI when it's installed.

## Install

```powershell
irm https://raw.githubusercontent.com/kyungjin830613-code/cc_profile/claude/powershell-install-script-18mf9g/install.ps1 | iex
```

> 저장소가 private이면 위 raw.githubusercontent.com 링크는 404가 됩니다. 저장소를 public으로 바꾼 뒤에만 동작합니다.

This downloads [`profile.ps1`](./profile.ps1) and installs it as your current
user's PowerShell profile (`$PROFILE`), backing up any existing profile first
(`$PROFILE.bak-<timestamp>`).

Restart PowerShell, or run `. $PROFILE`, to load it immediately.

## What you get

- **Prompt** — current path plus the current git branch, when inside a repo.
- **Navigation** — `ll`, `la`, `..`, `...`
- **Git shortcuts** — `gs`, `ga`, `gc`, `gp`, `gl`, `gd`, `gco`
- **Utilities** — `which`, `touch`
- **`cc`** — alias for `claude`, if the Claude Code CLI is on your `PATH`

## Updating

Re-run the install command above at any time; it overwrites your profile with
the latest version (after backing up the current one).
