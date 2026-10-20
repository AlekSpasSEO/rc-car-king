# Buying-list source and validation

The first buying list is content/articles/small-rc-cars-home-compact-outdoor-spaces.json, published 20 October 2026 for the 19–25 October Europe/Skopje week. Article publication date, rather than its revision date, fills the weekly quota.

Use the existing article fields plus selectionMethod and picks. Each pick has a sectionId, exact published review route/title/SKU, driving fit, strength, reservation, included/required equipment and startupNote. Its reference object records a dated USD manufacturer or clearly labeled permitted reference; it is not a live Amazon offer or an invented complete-start total. Optional photoNote clarifies equipment illustrated in manufacturer media.

The reusable scripts/listicle-picks.mjs renderer inherits the actual image/credit and exact affiliate URL from the linked complete-vehicle review, retaining its original identity date. It never reads credentials or contacts Amazon. Public offers remain subject to the existing owner pause and expiry rule.

Each visible pick maps to a real section and full review. Matching ItemList entries carry title, SKU, position and full-review URL; the unordered list is linked from Article.mainEntity. It does not add Product/Review ratings, stock or offers to an informational listicle. Guides without picks retain their previous rendering and schema.

The checker rejects wrong SKUs, duplicate routes/sections, unpublished or incomplete vehicles and missing startup information. It verifies rendered card counts, exact schema entries, affiliate tags/attributes, original author/publisher identities, metadata and discovery links. Run build/check for production and preview and inspect responsive output before publishing.
