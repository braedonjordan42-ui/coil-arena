#!/usr/bin/env bash
# Publishes (or updates) the game on GitHub Pages.
#   First time:   ./publish-github.sh            (creates the repo "coil-arena")
#   Custom name:  ./publish-github.sh my-snake
#   Updates:      ./publish-github.sh            (just run it again after editing)
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")"
REPO="${1:-coil-arena}"

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "✗ '$1' is not installed. Install it with:  sudo apt update && sudo apt install $2"
    exit 1
  fi
}
need git git
need gh gh

if ! gh auth status >/dev/null 2>&1; then
  echo "→ Log in to GitHub. Choose the browser option and paste the code it shows you."
  gh auth login --hostname github.com --git-protocol https --web
fi
gh auth setup-git >/dev/null 2>&1 || true

OWNER="$(gh api user -q .login)"
echo "→ GitHub user: $OWNER"

if [ ! -d .git ]; then git init -q; fi
git config user.name  >/dev/null 2>&1 || git config user.name  "$OWNER"
git config user.email >/dev/null 2>&1 || git config user.email "$(gh api user -q .id)+$OWNER@users.noreply.github.com"

git add -A
git commit -q -m "${COMMIT_MSG:-Update coil arena}" && echo "→ Saved a new version" || echo "→ No new changes to save"
git branch -M main

if ! git remote get-url origin >/dev/null 2>&1; then
  if gh repo view "$OWNER/$REPO" >/dev/null 2>&1; then
    echo "→ Using your existing repo $OWNER/$REPO"
  else
    echo "→ Creating public repo $OWNER/$REPO"
    gh repo create "$REPO" --public --description "coil — a neon snake arena you can play in the browser" >/dev/null
  fi
  git remote add origin "https://github.com/$OWNER/$REPO.git"
fi
FULL="$(gh repo view --json nameWithOwner -q .nameWithOwner)"

# Turn on GitHub Pages (built by the workflow in .github/workflows/pages.yml)
if ! gh api "repos/$FULL/pages" >/dev/null 2>&1; then
  echo "→ Turning on GitHub Pages"
  gh api -X POST "repos/$FULL/pages" -f build_type=workflow >/dev/null 2>&1 || true
else
  gh api -X PUT "repos/$FULL/pages" -f build_type=workflow >/dev/null 2>&1 || true
fi

echo "→ Uploading…"
git push -u origin main

URL="$(gh api "repos/$FULL/pages" -q .html_url 2>/dev/null || true)"
[ -n "$URL" ] || URL="https://$OWNER.github.io/${FULL#*/}/"
echo
echo "✓ Done! GitHub is building the site now (about 1 minute)."
echo "  Your game link:  $URL"
echo "  Watch progress:  gh run watch --repo $FULL"
echo
echo "  If you use Google sign-in, add '$OWNER.github.io' in Firebase →"
echo "  Authentication → Settings → Authorized domains."
