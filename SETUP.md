# Setup

This repo builds the GitHub profile README for **iamcharizar-ai**. The contents
must end up in the special repo `iamcharizar-ai/iamcharizar-ai` for GitHub to
render it on the profile page.

## 1. Push to the profile repo

The profile repo already exists. From this directory:

```bash
git init && git add -A && git commit -m "feat: animated profile README" && git branch -M main && git remote add origin https://github.com/iamcharizar-ai/iamcharizar-ai.git && git push -u origin main --force
```

`--force` overwrites the current stock "Hi there 👋" README. Check the repo has
nothing else you want to keep first.

## 2. Allow Actions to commit

Repo → Settings → Actions → General → Workflow permissions →
**Read and write permissions** → Save.

Without this the daily heatmap commit fails with a 403.

## 3. Add a token for private contributions (optional)

The default `GITHUB_TOKEN` only sees public activity. To include private
contributions in the heatmap:

1. Create a classic PAT with the `read:user` scope.
2. Repo → Settings → Secrets and variables → Actions → New repository secret.
3. Name it `PROFILE_TOKEN`, paste the token.

Skip this and the heatmap still works — it just counts public activity only.

## 4. Run it once

Actions tab → **Update profile art** → Run workflow. This generates
`contrib-heatmap.svg` and creates the `output` branch that holds the snake SVGs.

The README references the snake at `.../output/snake.svg`, so those images stay
broken until this first run finishes.

## Local development

```bash
node scripts/preview.mjs
```

Writes `preview/` using synthetic data — no token needed. Open
`preview/index.html` to check layout and replay the animation.

To render from real data:

```bash
PROFILE_TOKEN=ghp_yourtoken node scripts/generate-heatmap.mjs contrib-heatmap.svg
```

## Notes

- **`github-readme-stats` is on a shared instance that rate-limits.** It
  returned a 503 during setup. If the stats cards show errors, deploy your own
  instance to Vercel (the upstream repo documents this) and swap the hostname in
  the README.
- **Animation only survives via `<img src>`.** GitHub strips CSS animation from
  SVG pasted inline into markdown. Keep the heatmap as an `<img>` reference.
- **Sprite options** are in the Cool-GIFs-For-GitHub catalog under "Pixel GiFs".
  Swap the URL in the `$ whoami` section.
- The projects table is a placeholder. Pinned repos are set through GitHub's own
  UI (profile → Customize your pins); the table is the annotated version below it.
