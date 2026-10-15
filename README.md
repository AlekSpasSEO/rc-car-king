# RC Car King

A Tokyo night-racing RC review publication. Semantic HTML, responsive CSS, browser JavaScript and a dependency-free Node generator.

- [Production homepage](https://rccarking.com/)
- [About Aleksandar and RC Car King](https://rccarking.com/about/)
- [Privacy Policy](https://rccarking.com/privacy-policy/) and [Terms of Service](https://rccarking.com/terms-of-service/), reflecting the current site's services and linked from every footer.
- [Sitemap index](https://rccarking.com/sitemap_index.xml), [pages sitemap](https://rccarking.com/pages-sitemap.xml), [browsable site map](https://rccarking.com/sitemap/) and [llms.txt](https://rccarking.com/llms.txt), regenerated with every build. `/sitemap.xml` also serves the index for existing submissions.
- [In-depth Traxxas Nissan 240SX review](https://rccarking.com/traxxas/4-tec-drift-nissan-240sx/)
- [GitHub preview](https://alekspasseo.github.io/rc-car-king/)
- [Initial 50-review launch index](LAUNCH_ARCHIVE.md): eight real brands, complete vehicles and body-inclusive kits.
- Full product box: actual product photo, overview, specs, pros, cons, rating, buy/skip guidance and exact Amazon affiliate link.
- 2,000+ words of core vehicle analysis in every review, five category scores, full specifications, startup-cost and alternative-car tables, six FAQs, attributed official media and dated sources.
- The Garage Editor is an original house voice informed by RC Car Action, RC Driver and Big Squid RC. See EDITORIAL_VOICE.md.
- Reviews cover complete cars and body-inclusive car kits. The earlier chassis-only pilot remains a source draft.
- Shareable brand/price/use/search filters, RSS, sitemap, canonical metadata and Article/Review structured data.
- Eight crawlable brand archives, unique model-specific metadata, publisher/founder/editorial identities, Product with editorial Review and pros/cons, visible FAQs and social-card metadata.
- Visible breadcrumb microdata shares the same identities and values as JSON-LD. Navigation microdata, discovery links, robots.txt, image sitemap entries and affiliate-link attributes are checked during publication.
- [SEO audit and actual metadata inventory](SEO_AUDIT.md): sitemap coverage, schema facts, affiliate-link checks and discovery standards.

## Scheduled publication

Active in-chat schedules use Europe/Skopje: three complete vehicle reviews per weekday starting at 09:00, one listicle each Monday at 10:00, and one how-to/informational guide every day at 11:00, including weekends. Runs count already published content to avoid exceeding each quota or duplicating topics. See [publishing guide](CONTENT_GUIDE.md) and [article formats](CONTENT_FORMATS.md). The first listicle/guide run adds reusable rendering if its format is not yet supported.

## Local development

Node 22+; no npm dependencies.

    npm run build
    npm run check
    npm run dev

Open http://127.0.0.1:4318/rc-car-king/.

The checker verifies both the review standard and SEO requirements, including actual schema values, metadata uniqueness, sitemap/image coverage and sponsored Amazon links. Production uses the environment overrides documented in CLOUDFLARE.md. GitHub preview pages are noindex/follow. Each new published review requires `seo.title` and `seo.description`; see CONTENT_GUIDE.md.

## Search Console and Analytics

Google account: `alek.spas.seo@gmail.com`. Search Console domain property: `rccarking.com`, verified by a Cloudflare TXT record. Preserve that verification record. Submitted sitemap index: `https://rccarking.com/sitemap_index.xml`; child sitemap: `https://rccarking.com/pages-sitemap.xml`.

GA4 account `412166102`, property `559136253`, web stream `16138028848`, measurement ID `G-8VSLEXNZTW`. The production document template loads `analytics.js`; Google Analytics itself loads only after explicit acceptance. Cookie settings in the footer permits rejection or withdrawal. Advertising consent remains denied. Preview and local hosts do not collect analytics. Consent choices expire after 180 days, with a current-page fallback when storage is unavailable. `npm run check` includes consent regression checks. Enhanced measurement excludes site-search, form-interaction and browser-history page-view events to avoid measuring filter input as navigation.

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
