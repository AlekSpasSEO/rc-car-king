# RC Car King

An original Tokyo night-racing design for an RC review publication. Built with semantic HTML, CSS, browser JavaScript and a dependency-free Node static generator.

- [Homepage preview](https://alekspasseo.github.io/rc-car-king/)
- [Tamiya TT-02D review](https://alekspasseo.github.io/rc-car-king/tamiya/tt-02d/)
- Routes: `/brand/model-name/` (the temporary GitHub Pages repository prefix disappears when the domain is connected).
- Responsive layouts, composable brand/price/use/search filters, shareable filter URLs, accessible controls, RSS, sitemap, canonical metadata and article structured data.
- The initial review is clearly labeled as specification-based, with primary sources and no invented testing or numeric rating.

## Run locally

Requires Node 22 or later; there are no npm dependencies.

```sh
npm run build
npm run check
npm run dev
```

Open http://127.0.0.1:4318/rc-car-king/.

## Publish

GitHub Pages should serve branch `main`, folder `/docs`. Generated `docs/` is committed so daily updates can publish without third-party credentials or an API key. No custom domain is connected yet.

Daily publication is scheduled through the Codex chat automation at 09:00 Europe/Skopje; its runtime availability governs execution. [CONTENT_GUIDE.md](CONTENT_GUIDE.md) describes the source-backed editorial workflow. New records automatically update the archive, review pages, RSS and sitemap when rebuilt. Future-dated and draft records are excluded from publication.

## Visual assets

`public/assets/night-drift.png` is original AI-generated concept artwork produced with the built-in ImageGen tool. It is not product photography. Final prompt: a clearly miniature unbranded silver drift coupe in a wet Tokyo alley at midnight, 1990s racing-magazine film texture, cyan underglow, acid lime and pink neon, transmitter in the background, no logos or legible text. Fonts: Barlow Condensed, DM Sans and Space Mono via Google Fonts, with system fallbacks.
