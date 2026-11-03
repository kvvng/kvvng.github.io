# Kaiyuan Wang's website

An Astro site for https://kvvng.github.io, following the STARLab repository structure. The homepage is intentionally blank while the site is rebuilt.

## Structure

```text
assets/                     Images and other source assets
src/
  components/               Shared UI components
  layouts/SiteLayout.astro  HTML document shell
  pages/index.astro         Homepage
.github/workflows/deploy.yml
astro.config.mjs
```

## Local development

```sh
nvm install
nvm use
npm ci
npm run dev
```

Open the URL printed by Astro, normally http://localhost:4321.

## Check and build

```sh
npm run check
npm run build
npm run preview
```

The production build is written to `dist/`. Generated files and installed dependencies are ignored by Git.

## Publish

Set the repository's **Settings → Pages → Source** to **GitHub Actions** before the first Astro deployment. Pushes to `main` then build and publish through `.github/workflows/deploy.yml`.

The former Jekyll site is preserved in Git history through commit `108334c`.
