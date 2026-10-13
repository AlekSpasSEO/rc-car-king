# RC Car King production hosting

Production: https://rccarking.com · Cloudflare Pages project `rc-car-king`.

Cloudflare builds the GitHub repository `AlekSpasSEO/rc-car-king`, branch `main`, with:

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

`www` redirects to the HTTPS apex with status 301, retaining the requested path and query string. This is a Cloudflare zone Single Redirect in phase `http_request_dynamic_redirect`, ruleset `abb2d7c1a08e4cc7bb78c92f8d610dbc`, rule `3eadab97c46046058b3247b305f32612`. Its match is `http.host eq "www.rccarking.com"`; the target expression is `concat("https://rccarking.com", http.request.uri.path)`. Pages `_redirects` does not support domain-level redirects. Amazon offer JSON is served without caching; unavailable entries retain their verified affiliate URLs with commercial data cleared, and successful offers expire after 24 hours.

Daily publication continues through the same repository. Build/check and commit source plus the GitHub preview `docs` together; Cloudflare independently rebuilds the production version. Verify that a deployment starts for the pushed commit. If the Git integration does not start it, create a Git-branch deployment of `main` through the existing Cloudflare Pages API project, using the authorized connector; do not create another project or fall back to stale output. The first production build was explicitly triggered through that API. Verify the production review URL and the matching successful Cloudflare deployment before notifying.

At launch, the dashboard reported the project disconnected from its Git account. GitHub installation `170220541` management requires GitHub sudo reauthentication. Until that connection is renewed, the tested Git-branch API deployment is the publishing path; the daily automation explicitly uses that fallback.
