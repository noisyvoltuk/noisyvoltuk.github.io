#!/usr/bin/env bash
# One-time setup: create the GitHub repo, push, enable Pages (GitHub Actions source),
# and create the "link" label used by quick capture. Needs gh logged in (gh auth login).
set -euo pipefail
OWNER="${OWNER:-noisyvoltuk}"
REPO="${REPO:-$OWNER.github.io}"

gh repo create "$OWNER/$REPO" --public --source=. --remote=origin --push \
  --description "Personal site: projects, notes, links and music"

# Pages, built by the Deploy site workflow rather than from a branch.
gh api -X POST "repos/$OWNER/$REPO/pages" -f build_type=workflow >/dev/null \
  || gh api -X PUT "repos/$OWNER/$REPO/pages" -f build_type=workflow >/dev/null

gh label create link --repo "$OWNER/$REPO" --color FB923C --description "Quick capture: save as a links entry" --force

# The first push ran before Pages existed, so deploy again now.
gh workflow run deploy.yml --repo "$OWNER/$REPO" --ref main
echo "Done. Watch the deploy: gh run watch --repo $OWNER/$REPO"
echo "Site: https://$OWNER.github.io/"
