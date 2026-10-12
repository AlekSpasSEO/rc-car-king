# RC Car King publishing guide

Publish one in-depth, source-backed RC car review per day at /brand/model-name/. Preview: https://alekspasseo.github.io/rc-car-king/. Do not connect rccarking.com until the owner requests it.

## Editorial scope and voice

Read EDITORIAL_VOICE.md before writing. Use the original Garage Editor house voice: practical, interested, technically clear, with specific buyer judgments. For now publish complete RC cars and body-inclusive car kits from real manufacturers. Exclude replacement bodies, spare parts, standalone electronics and bare chassis. The old TT-02D chassis-only pilot is retained as a source draft.

## Daily publication

1. Safely sync AlekSpasSEO/rc-car-king main. Preserve owner changes and concurrent work. Use Europe/Skopje for publication dates. If a complete published review already has today's date, do not add a duplicate; an offer refresh may still be useful.
2. Select a real vehicle not already reviewed. Rotate brands, budgets and uses. Identify the exact SKU, generation, drivetrain, motor and variant. Research current manufacturer product pages and manuals, then add relevant attributable independent coverage. Never transfer test results from another variant.
3. Follow content/reviews/traxxas-4-tec-drift-nissan-240sx.json and scripts/review-template.mjs. Aim for 2,000–3,000 useful words. Every published review needs the full top product box: actual product image, overview, six key specs, pros, cons, buy/skip guidance, author/date details, editorial rating and exact Amazon affiliate URL. Include deeper setup, controls, terrain, ownership access, complete startup cost, alternatives, verdict, a full spec table, FAQs and dated sources.
4. Use Amazon Creators API for product identity and commercial information. scripts/amazon.mjs supports --keywords and --asin. Use existing environment credentials, or the owner's existing local credential CSV at C:/Users/ASUS/Downloads/Coffeedant-credentials.csv. Keep credentials in memory; never copy them into the repository, browser code, logs or output. The current public affiliate tag is coffeedant03-20. Verify ASIN, brand and manufacturer SKU before using a result; the same search can return complete cars, spare bodies and different power systems.
5. Set vehicleScope to Complete RC car and status to published only once the record meets the requirements. Future-dated and draft records stay out of the public archive.
6. Refresh commercial data with: npm run refresh:amazon -- --credentials "C:/Users/ASUS/Downloads/Coffeedant-credentials.csv" (or use environment credentials). The refresh validates exact ASIN, manufacturer SKU and brand for every published vehicle and saves only sanitized public offer data. If it fails, do not fabricate a price; retain the exact product link and let the browser's 24-hour freshness rule hide an expired snapshot.
7. Run npm run build and npm run check. Inspect the product box, full article, photos, offer display, links, FAQ and mobile tables. Keep generated docs/ committed with source/content changes. Commit and push main; GitHub Pages serves main /docs.
8. Verify the live review and homepage before reporting publication. Notify with the review link on successful publication, or a concrete blocker on failure. Stay quiet when there is no meaningful change.

## Required labeling

Every review must have exact brand/model/SKU, kebab-case slugs, type, intended use, terrain, motor, power source, drivetrain, scale, purchase format, intended buyer experience, and dated price basis.

Use Drifting, Bashing, Crawling, Racing or Trail driving for the use filter. Use manufacturer-supported terrain labels. Separate motor type (Brushed, Brushless, Nitro, Gas, Not included or Unknown) from power source. Keep drivetrain terminology precise: RWD, FWD, 2WD, 4WD or AWD as appropriate.

Initial price filters use a dated USD manufacturer reference or verified vehicle price, not total ownership cost. Preserve cents. Explain missing equipment and the complete startup basket in the article.

## Ratings and evidence

Use a clearly labeled research-led editorial buying assessment for a named buyer. Five equally weighted, reasoned category scores produce the overall rating. Do not score measured speed, handling, crash resistance, long-term reliability or runtime without actual testing evidence. Do not confuse the editorial score with Amazon customer ratings.

Separate manufacturer facts, independent observations, owner reports and editorial inferences. Never invent a tester biography, ownership experience, measurements, quotes, discounts or sponsorship. Record conflicting source figures rather than silently fixing them. Update dates for substantive revisions.

## Product photos

Use actual official model photos and technical illustrations, with source links and credits. Maintain MEDIA_SOURCES.md. Keep the generated Tokyo artwork on the homepage as atmosphere; do not use it as review product photography. Community photos need appropriate permission and attribution before republication.

## Domain later

When authorized, change site.config.json origin to https://rccarking.com and basePath to an empty string, configure the chosen host, rebuild and deploy. Review paths stay /brand/model-name/. Regenerate canonical metadata, feed and sitemap. Do not add a CNAME during preview.
