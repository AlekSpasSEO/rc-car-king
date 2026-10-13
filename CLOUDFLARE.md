# RC Car King production hosting

Production: https://rccarking.com · Cloudflare Pages project `rc-car-king`.

Cloudflare builds the GitHub repository `AlekSpasSEO/rc-car-king` automatically on pushes to `main`:

- Build command: `npm run build && npm run check`
- Output directory: `docs`
- `NODE_VERSION=22`
- `SITE_ORIGIN=https://rccarking.com`
- `BASE_PATH=` (empty, so review paths are `/brand/model-name/`)

The generator already supports these environment overrides. The checker uses the same settings and verifies canonical URLs and internal links. GitHub Pages remains a preview using the default origin/basePath in `site.config.json`. The `production` entry records the separate production target.

Cloudflare account: `0529c55ace04686c78b5f87e1d26e53a`.
DNS zone: `41b3a6614b953040b1aede38ebf25d8d`.
Cloudflare nameservers: `eoin.ns.cloudflare.com`, `jen.ns.cloudflare.com`.
The domain registration remains at GoDaddy.

DNS migration inventory, checked 13 October 2026: GoDaddy parked apex A, `www` CNAME to apex, `_domainconnect` CNAME to `_domainconnect.gd.domaincontrol.com`, and `_dmarc` TXT `v=DMARC1; p=quarantine; adkim=r; aspf=r; rua=mailto:dmarc_rua@onsecureserver.net;`. No MX records were present. GoDaddy's apex NS/SOA records are replaced by Cloudflare's authoritative zone. The website apex and `www` target `rc-car-king.pages.dev`; the other CNAME and TXT are preserved.

`www` redirects to the apex, retaining the requested path. Amazon offer JSON is served without caching; unavailable entries retain their verified affiliate URLs with commercial data cleared, and successful offers expire after 24 hours.

Daily publication continues through the same repository. Build/check and commit source plus the GitHub preview `docs` together; Cloudflare independently rebuilds the production version on every push. Verify the production review URL and the matching successful Cloudflare deployment before notifying.
