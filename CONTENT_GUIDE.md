# RC Car King publishing guide

Publish one in-depth, source-backed RC car review per day at /brand/model-name/. Production: https://rccarking.com/ on Cloudflare Pages, authorized by the owner on 13 October 2026. GitHub preview: https://alekspasseo.github.io/rc-car-king/. See CLOUDFLARE.md for the hosting configuration.

## Editorial scope and voice

Read EDITORIAL_VOICE.md before writing. Use the original Garage Editor house voice: practical, interested, technically clear, with specific buyer judgments. For now publish complete RC cars and body-inclusive car kits from real manufacturers. Exclude replacement bodies, spare parts, standalone electronics and bare chassis. The old TT-02D chassis-only pilot is retained as a source draft.

## Daily publication

The owner authorized an initial 50-review launch archive on 13 October 2026. That one launch batch is an explicit exception to the one-per-day rule. The daily cadence resumes after launch; do not backdate launch articles or turn the launch exception into routine bulk publication. Preserve active batch work and avoid publishing from partially written records.

1. Safely sync AlekSpasSEO/rc-car-king main. Preserve owner changes and concurrent work. Use Europe/Skopje for publication dates. If a complete published review already has today's date, do not add a duplicate; an offer refresh may still be useful.
2. Select a real vehicle not already reviewed. Rotate brands, budgets and uses. Identify the exact SKU, generation, drivetrain, motor and variant. Research current manufacturer product pages and manuals, then add relevant attributable independent coverage. Never transfer test results from another variant.
3. Follow content/reviews/traxxas-4-tec-drift-nissan-240sx.json and scripts/review-template.mjs. Aim for 2,000–3,000 useful words. Every published review needs the full top product box: actual product image, overview, six key specs, pros, cons, buy/skip guidance, author/date details, editorial rating and exact Amazon affiliate URL. Include deeper setup, controls, terrain, ownership access, complete startup cost, alternatives, verdict, a full spec table, FAQs and dated sources.
4. Use Amazon Creators API for product identity and commercial information. scripts/amazon.mjs supports --keywords and --asin. Use existing environment credentials, or the owner's existing local credential CSV at C:/Users/ASUS/Downloads/Coffeedant-credentials.csv. Keep credentials in memory; never copy them into the repository, browser code, logs or output. The current public affiliate tag is coffeedant03-20. Verify ASIN, brand and manufacturer SKU before using a result; the same search can return complete cars, spare bodies and different power systems.

   If the API uses a documented distributor prefix or regional part suffix for the same exact vehicle, retain the official SKU in `sku` and `amazon.sku`, set the exact returned value in `amazon.apiSku`, and explain the mapping in `amazon.identityNote` and the evidence record. The refresh still requires an exact API part match; do not strip prefixes or accept approximate strings. Verify regional package differences separately.
5. Set vehicleScope to Complete RC car and status to published only once the record meets the requirements. Future-dated and draft records stay out of the public archive.
6. Refresh commercial data with: npm run refresh:amazon -- --credentials "C:/Users/ASUS/Downloads/Coffeedant-credentials.csv" (or use environment credentials). The refresh validates exact ASIN, manufacturer SKU and brand independently for every published vehicle and saves only sanitized public offer data. Missing, inaccessible or mismatched items retain the previously verified review link with price and seller cleared immediately; other valid offers still update. A rejected batch is retried one item at a time. Inspect the reported unavailable identities without replacing them with approximate listings. If authentication fails before a refresh can run, retain the prior snapshot and let the browser's 24-hour freshness rule hide it on expiry. Never fabricate prices.
7. Run npm run build and npm run check. Inspect the product box, full article, photos, offer display, links, FAQ and mobile tables. Keep generated docs/ committed with source/content changes. Commit and push main; GitHub Pages serves main /docs as a preview. Cloudflare Pages rebuilds main with SITE_ORIGIN=https://rccarking.com and BASE_PATH empty, then runs the checker before deployment. Follow the deployment trigger and verification procedure below.
8. Verify that Cloudflare starts a deployment for the pushed commit. If the Git integration does not start it, trigger a Git-branch deployment of main through the authorized Cloudflare connector on the existing rc-car-king Pages project, then verify the matching successful deployment. Check the live review at https://rccarking.com/brand/model-name/ and the homepage before reporting publication. Notify with the production review link on successful publication, or a concrete blocker on failure. Stay quiet when there is no meaningful change.

## SEO, identity and affiliate requirements

Set `seo.title` and `seo.description` to specific copy for the exact reviewed model. Use a concise model/variant review title with the RC Car King brand; target roughly 35–65 characters where practical. Write a distinct description of roughly 130–160 characters using verified facts and the buying questions covered. These are editorial targets, not hard Google character limits. Do not truncate a model into another variant or copy another review’s metadata.

The build emits matching Open Graph/Twitter values, publisher/author identities, Product with nested editorial Review and visible pros/cons, Article, BreadcrumbList and FAQPage data directly from the record. Keep the schema facts, scores, FAQs, citations and image dimensions aligned with visible content. Do not add fabricated customer stars, review counts, seller inventory, static Amazon prices or hands-on claims to schema.

Buying links and Amazon evidence links must carry the verified account’s affiliate tag and be labeled sponsored/nofollow. Manufacturer and independent citations remain source links. About/profile identities come from content/site.json; do not turn The Garage Editor house voice into a fictional tester biography. The About page links the owner’s Coffeedant background and explains AI-assisted research and drafting.

The generator updates brand archives, RSS, the XML sitemap (real modification dates and product image URLs) and an optional llms.txt directory. Draft, future-dated and 404 pages stay out of the sitemap. The GitHub preview is noindex/follow; production remains indexable with its own canonicals. llms.txt is a supplemental reader directory, not a Google ranking standard. Rich-result display, crawling, indexing and AI citations are determined by the platforms; do not promise them as a result of markup.

## Vehicle labels

Every review must have exact brand/model/SKU, kebab-case slugs, type, intended use, terrain, motor, power source, drivetrain, scale, purchase format, intended buyer experience, and dated price basis.

Use Drifting, Bashing, Crawling, Racing or Trail driving for the use filter. Use manufacturer-supported terrain labels. Separate motor type (Brushed, Brushless, Nitro, Gas, Not included or Unknown) from power source. Keep drivetrain terminology precise: RWD, FWD, 2WD, 4WD or AWD as appropriate.

Initial price filters use a dated USD manufacturer reference or verified vehicle price, not total ownership cost. Preserve cents. Explain missing equipment and the complete startup basket in the article.

Use independently verified manufacturer USD prices/MSRP for static article and filter references. When unavailable, an exact-model first-party hobby-retailer reference is acceptable, clearly labeled as retailer pricing. Mark discontinued/archived and indexed manufacturer references explicitly; do not imply they are currently orderable. Keep Amazon API prices in the timestamped, expiring offer display rather than permanent article prose or filter references. The daily refresh validates all reviewed product identities and refreshes the commercial snapshot.

## Ratings and evidence

Use a clearly labeled research-led editorial buying assessment for a named buyer. Five equally weighted, reasoned category scores produce the overall rating. Do not score measured speed, handling, crash resistance, long-term reliability or runtime without actual testing evidence. Do not confuse the editorial score with Amazon customer ratings.

Separate manufacturer facts, independent observations, owner reports and editorial inferences. Never invent a tester biography, ownership experience, measurements, quotes, discounts or sponsorship. Record conflicting source figures rather than silently fixing them. Update dates for substantive revisions.

## Product photos

Use actual official model photos and technical illustrations, with source links and credits. Maintain MEDIA_SOURCES.md. Keep the generated Tokyo artwork on the homepage as atmosphere; do not use it as review product photography. Community photos need appropriate permission and attribution before republication.

## Production domain

The owner authorized connecting rccarking.com through Cloudflare on 13 October 2026. Production uses the root path and canonical origin https://rccarking.com, including feed, sitemap and social metadata. The existing build environment overrides preserve the separate GitHub preview. Keep the Cloudflare GitHub integration enabled so daily main pushes update production. The domain registration remains at GoDaddy; Cloudflare hosts DNS and the website. Do not add a GitHub CNAME; the production domain is attached to Cloudflare Pages.
