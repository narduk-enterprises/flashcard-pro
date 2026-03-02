---
description: Generate branding assets (logo, favicons, apple-touch-icon, webmanifest) for a project
---

# /generate-branding

Generate a complete set of branding assets for a Nuxt app in the monorepo.

## Prerequisites

- `sharp` must be installed: `pnpm add -wD sharp` (already in `onlyBuiltDependencies`)

## Steps

### 1. Determine the Target App

Ask the user which app the branding is for, or infer from context. The target public directory is:

- **Layer defaults**: `layers/narduk-nuxt-layer/public`
- **Specific app**: `apps/<app-name>/public`

### 2. Generate the Logo SVG

Use the `generate_image` tool to create a logo based on the project's identity:

```
Prompt: "A minimal, modern app icon for [APP_NAME]. Simple geometric shape, vibrant gradient,
clean flat design suitable for a 32x32 favicon. No text, no background frame, square aspect ratio."
```

Save the generated image, then convert it to an optimized SVG or use it as the source PNG.

Alternatively, create a simple SVG favicon directly. Example format:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#10b981"/>
  <text x="5" y="24" font-family="system-ui, sans-serif" font-size="20" font-weight="bold" fill="white">N4</text>
</svg>
```

Save to `<target>/favicon.svg`.

### 3. Run the Favicon Generator

```bash
# For layer defaults:
pnpm generate:favicons

# For a specific app with custom name:
pnpm generate:favicons -- --target=apps/my-app/public --name="My App" --short-name="MA"

# With custom colors:
pnpm generate:favicons -- --target=apps/my-app/public --name="My App" --color="#6366f1" --bg="#1e1b4b"
```

This generates:

- `apple-touch-icon.png` (180×180)
- `favicon-32x32.png` (32×32)
- `favicon-16x16.png` (16×16)
- `favicon.ico` (32×32)
- `site.webmanifest`

### 4. Verify in Browser

1. Start the dev server for the target app
2. Open the app in a browser
3. Check that the favicon appears in the browser tab
4. Check DevTools Network tab — `/apple-touch-icon.png` should return 200
5. Confirm no Vue Router warnings about missing icon paths in the terminal

### 5. Update Schema.org Logo (if applicable)

If the app has a `schemaOrg.identity.logo` in `nuxt.config.ts`, update it to point to the new favicon:

```ts
schemaOrg: {
  identity: {
    logo: '/favicon.svg',
  }
}
```

## Available Options

| Option         | Default                           | Description                     |
| -------------- | --------------------------------- | ------------------------------- |
| `--target`     | `layers/narduk-nuxt-layer/public` | Output directory                |
| `--source`     | `<target>/favicon.svg`            | Source SVG path                 |
| `--name`       | `Nuxt 4 App`                      | Full name in webmanifest        |
| `--short-name` | First 12 chars of `--name`        | Short name in webmanifest       |
| `--color`      | `#10b981`                         | Theme color in webmanifest      |
| `--bg`         | `#0B1120`                         | Background color in webmanifest |
