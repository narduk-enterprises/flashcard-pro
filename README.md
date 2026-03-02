# FlashCardPro

**flashcard-pro** — initialized from `narduk-nuxt-template`.

## Live Site
[https://flashcard-pro.narduk.workers.dev](https://flashcard-pro.narduk.workers.dev)

## Local Development

1. Setup environment variables (e.g. via Doppler)
2. Run database migration: `pnpm run db:migrate`
3. Start dev server: `pnpm run dev`

## Deployment

Pushes to `main` are automatically built and deployed via the GitHub Actions CI workflow (`.github/workflows/ci.yml`) using `pnpm run deploy`.

**If deploy never runs**, the Preflight job requires one of:

1. **Doppler (recommended):** `DOPPLER_TOKEN` in the repo’s **Settings → Secrets and variables → Actions**.  
   To set it automatically: ensure `git remote` points to this repo, run `gh auth login`, then:
   ```bash
   pnpm run setup -- --name="flashcard-pro" --display="FlashCardPro" --url="https://flashcard-pro.narduk.workers.dev" --repair
   ```
2. **Direct Cloudflare:** Add **Settings → Secrets and variables → Actions**:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

Then push to `main` or run the **CI** workflow manually. Validate with: `doppler run -- pnpm run validate` (or run `pnpm run validate` if using direct Cloudflare).
