# One-time setup on Windows: create the GitHub repo, push, enable Pages (GitHub Actions source),
# and create the "link" label used by quick capture. Needs Git and GitHub CLI, logged in (gh auth login).
# Run from the repo folder:  powershell -ExecutionPolicy Bypass -File scripts\setup-repo.ps1
$ErrorActionPreference = 'Stop'
$Owner = if ($env:OWNER) { $env:OWNER } else { 'noisyvoltuk' }
$Repo = if ($env:REPO) { $env:REPO } else { "$Owner.github.io" }

gh repo create "$Owner/$Repo" --public --source=. --remote=origin --push --description "Synthesizers, CSound and electronic music"
if ($LASTEXITCODE) { throw 'gh repo create failed' }

# Pages, built by the Deploy site workflow rather than from a branch.
gh api -X POST "repos/$Owner/$Repo/pages" -f build_type=workflow | Out-Null
if ($LASTEXITCODE) {
  gh api -X PUT "repos/$Owner/$Repo/pages" -f build_type=workflow | Out-Null
  if ($LASTEXITCODE) { Write-Warning 'Could not enable Pages: set Settings > Pages > Source to GitHub Actions by hand.' }
}

gh label create link --repo "$Owner/$Repo" --color FB923C --description "Quick capture: save as a links entry" --force

# The first push ran before Pages existed, so deploy again now.
gh workflow run deploy.yml --repo "$Owner/$Repo" --ref main
Write-Host "Done. Watch the deploy: gh run watch --repo $Owner/$Repo"
Write-Host "Site: https://$Owner.github.io/"
