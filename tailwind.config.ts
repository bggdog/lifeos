/**
 * HeroUI v3 registers Tailwind layers and tokens through `@import "@heroui/styles"` in `src/index.css`
 * (that import is the supported “plugin” surface for v3 — there is no separate `@heroui/*` JS plugin).
 * This file is loaded via `@config` so your `content` paths stay explicit for class detection.
 */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
}
