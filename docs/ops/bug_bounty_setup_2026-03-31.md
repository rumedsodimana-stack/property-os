# Bug Bounty Setup

Date: 2026-03-31

Use this environment only against assets that are explicitly in scope for a published bug bounty or written authorization.

## Local Environment

- Homebrew binaries: `/opt/homebrew/bin`
- Workspace: `/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/bugbounty`
- Env loader: `/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/scripts/bug_bounty_env.sh`
- Bootstrap: `/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/scripts/bootstrap_bug_bounty_env.sh`
- Doctor: `/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/scripts/bug_bounty_doctor.sh`

## What Is Already Available

- `amass`
- `ffuf`
- `nmap`
- `gh`
- `go`
- `node`
- `sqlmap`
- `nikto`
- `uv`
- `python3`
- `curl`
- `jq`

## Bootstrap Command

```zsh
source /Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/scripts/bug_bounty_env.sh
/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/scripts/bootstrap_bug_bounty_env.sh
/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/scripts/bug_bounty_doctor.sh
```

## Python Packages Installed By Bootstrap

- `requests`
- `httpx`
- `beautifulsoup4`
- `dnspython`
- `rich`
- `python-dotenv`
- `pyyaml`

## Starting Targets

- `Hacker101` for hands-on training and private invite eligibility
- `HackerOne public programs` once the account is available
- `Bugcrowd hacker platform` once the account is available
- `Apple Security Research / Apple Security Bounty`
- `Microsoft Security Response Center bounty programs`

## Notes

- `gh` is authenticated for `github.com` as `rumedsodimana-stack`, which makes GitHub bounty issue discovery usable from the CLI.
- Current browser-accessible sessions were logged out of Upwork, Freelancer, Fiverr, and GitHub during the last check.
- Direct outreach remains the live revenue lane while marketplace and bounty accounts are not yet active.
