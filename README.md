# RC Car King

A Tokyo night-racing RC review publication. Semantic HTML, responsive CSS, browser JavaScript and a dependency-free Node generator.

- [Production homepage](https://rccarking.com/)
- [About Aleksandar and RC Car King](https://rccarking.com/about/)
- [In-depth Traxxas Nissan 240SX review](https://rccarking.com/traxxas/4-tec-drift-nissan-240sx/)
- [GitHub preview](https://alekspasseo.github.io/rc-car-king/)
- [Initial 50-review launch index](LAUNCH_ARCHIVE.md): eight real brands, complete vehicles and body-inclusive kits.
- Full product box: actual product photo, overview, specs, pros, cons, rating, buy/skip guidance and exact Amazon affiliate link.
- 2,000+ words of core vehicle analysis in every review, five category scores, full specifications, startup-cost and alternative-car tables, six FAQs, attributed official media and dated sources.
- The Garage Editor is an original house voice informed by RC Car Action, RC Driver and Big Squid RC. See EDITORIAL_VOICE.md.
- Reviews cover complete cars and body-inclusive car kits. The earlier chassis-only pilot remains a source draft.
- Shareable brand/price/use/search filters, RSS, sitemap, canonical metadata and Article/Review structured data.
- Eight crawlable brand archives, unique model-specific metadata, publisher/founder/editorial identities, Product with editorial Review and pros/cons, visible FAQs and social-card metadata.
- [SEO audit and actual metadata inventory](SEO_AUDIT.md): sitemap coverage, schema facts, affiliate-link checks and discovery standards.

## Local development

Node 22+; no npm dependencies.

    npm run build
    npm run check
    npm run dev

Open http://127.0.0.1:4318/rc-car-king/.

The checker verifies both the review standard and SEO requirements, including actual schema values, metadata uniqueness, sitemap/image coverage and sponsored Amazon links. Production uses the environment overrides documented in CLOUDFLARE.md. GitHub preview pages are noindex/follow. Each new published review requires `seo.title` and `seo.description`; see CONTENT_GUIDE.md.

## Amazon integration

Amazon Creators API is used for exact manufacturer SKU/ASIN/brand verification, variant identification, price, seller and availability. Current affiliate tag: coffeedant03-20. No credentials are committed.

    node scripts/amazon.mjs --keywords "Traxxas Nissan 240SX 105247-4" --credentials "<local CSV>"
    npm run refresh:amazon -- --credentials "<local CSV>"

Alternatively supply AMAZON_CREATORS_CREDENTIAL_ID, AMAZON_CREATORS_CREDENTIAL_SECRET and AMAZON_CREATORS_CREDENTIAL_VERSION as environment variables. The public offer snapshot is sanitized; browser code never sees the API token. Price and seller display expires after 24 hours, including on an already-open page. Exact-product affiliate links remain usable. The editorial rating is separate from Amazon customer stars.

## Publishing

Cloudflare Pages project `rc-car-king` builds main and serves https://rccarking.com/ with root review paths /brand/model-name/. Its build environment sets SITE_ORIGIN=https://rccarking.com and BASE_PATH empty, then runs `npm run build && npm run check`. The daily automation verifies that the pushed commit deploys and triggers a Git-branch API deployment if the Git connection does not start it. See CLOUDFLARE.md. GitHub Pages still serves main /docs as a separate preview using the default configuration. Commit generated preview docs with source/content updates. The daily automation remains scheduled for 09:00 Europe/Skopje and follows CONTENT_GUIDE.md, verifying production after every push.

## Media

MEDIA_SOURCES.md and the launch manifests record all official images and technical illustrations used across the 50 reviews. They are credited manufacturer media, not our test photographs.

public/assets/night-drift.png remains original homepage atmosphere made with the built-in ImageGen tool. Prompt: a clearly miniature unbranded silver drift coupe in a wet Tokyo alley at midnight, 1990s racing-magazine film texture, cyan underglow, acid lime and pink neon, transmitter in the background, no logos or legible text. Fonts: Barlow Condensed, DM Sans and Space Mono, with system fallbacks.
