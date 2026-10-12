# RC Car King editorial guide

Publish one original, source-backed RC car review per day at `/brand/model-name/`. Current preview: https://alekspasseo.github.io/rc-car-king/. Do not connect rccarking.com until the owner requests it.

## Daily workflow

1. Sync `AlekSpasSEO/rc-car-king` main before editing. Do not overwrite changes from the owner. Check today's publication date in Europe/Skopje and skip if a review already exists for that date.
2. Choose a model not already covered. Rotate brands, budgets and uses: drift, bashing, crawling, racing and trail driving. Research the exact model, SKU and regional variant using current manufacturer product pages and manuals. Use at least two primary sources where available. Do not invent missing facts.
3. Add one JSON record in `content/reviews/`, following the launch review's structure. Set `status` to `published` and today's date only after the record meets the quality requirements. A draft remains `draft`.
4. Run `npm run build` and `npm run check`. Inspect the generated review and archive. Commit both content/source updates and `docs/` together, then push to main. GitHub Pages serves main's `/docs` folder automatically.
5. Verify the published review URL. If deployment fails, investigate before reporting completion. Report a concrete blocker if authoritative information is insufficient; never substitute fictional tests to hit the daily target.

## Required labels

| Field | Values or convention |
| --- | --- |
| Brand/model/SKU | Exact manufacturer name and variant; kebab-case URL slugs |
| Type | Drift car, touring car, buggy, short-course truck, monster truck, crawler, rally car, trail truck |
| Use | Drifting, Bashing, Crawling, Racing, Trail driving |
| Terrain | On-road, Off-road, Mixed, Rock; only supported claims |
| Motor | Brushed, Brushless, Nitro, Gas, Not included, Unknown |
| Power | Electric, Nitro, Gas |
| Drive | 2WD, RWD, FWD, 4WD, AWD; preserve manufacturer's terminology |
| Scale | Manufacturer-stated scale |
| Format | Ready-to-run, Assembly kit, Rolling chassis, Bind-and-drive; specify missing equipment |
| Skill | Suggested buyer experience; an editorial inference |
| Price | Numeric amount, ISO currency, precise price basis, check date and source |

Use USD for the initial archive. Prefer current US MSRP with a clear label; if a sourced street price is used, label the retailer, date and exclusions. Do not convert unsupported price claims. The price filter compares the labeled kit/vehicle price, not total ownership cost. Unknown prices require adapting the schema and filter explicitly rather than entering zero.

## Review quality

Use original prose and a specific, conditional verdict. Cover what it is, who it fits, terrain/use, setup, complete purchase cost, limitations, pros/cons, specs and source dates. Do not call these hands-on reviews without actual supplied testing evidence. No fabricated speed, battery runtime, durability result, score or owner quote. Explain which conclusions are editorial inferences.

Use `headlineLines` for a short display title (two lines recommended). Every record must have its own model title and route. Use original concept artwork, clearly labeled, until licensed or owner-supplied product photography is available. Never imply a generic generated image depicts the reviewed model. Do not invent affiliate links or sponsorship. Keep source-derived summaries concise and write analysis in your own words.

## Domain connection later

When authorized, change `site.config.json` origin to `https://rccarking.com` and basePath to an empty string; add the domain through the selected host, rebuild and deploy. The review paths remain `/brand/model-name/`. Regenerate canonical URLs, sitemap and feed. Do not add a CNAME during the preview phase.
