# Contribution cache: Worker + KV

## Status and permissions

Code only, not deployed. No Worker, KV namespace, Secret, paid subscription, or Cloudflare authorization was created. The site endpoint defaults to empty and continues to display the verified repository snapshot. The former daily GitHub contents:write workflow and publication script have been removed; this design never writes daily commits to main.

Deploy only after the owner confirms Cloudflare resource creation/deployment. The owner creates an appropriate GitHub read token and enters it directly as the Worker Secret GITHUB_TOKEN. Never paste it into chat, this repository, a URL, a command argument, or client code. Do not generate, transfer, or enter it on the owner's behalf. No additional refresh key is needed.

## Behavior

- GET /api/contributions returns cached public aggregates for fixed user Wang060919. Other paths/query strings are 404; POST is 405; there is no HTTP refresh route or arbitrary user/URL proxy.
- Cron 0 16 * * * is UTC16:00, Beijing next-day00:00. Cron timing is not a delivery SLA. GitHub calendar dates remain UTC; at Beijing midnight the most recent UTC date is still the previous day and is not finished yet.
- Cron makes one bounded official GraphQL request, checks the entire date range/count/level/total, then replaces one KV key. API/parse/validation failure performs no put. There is no KV expiration, so a failed refresh keeps the last good data.
- Cold GET performs one text+metadata KV read, then stores CORS-free JSON in the local edge Cache API for 300 seconds. Warm GET does no JSON parsing or calendar revalidation. Cron validates before storing. KV propagation and edge caching can delay visibility; an older timestamp is kept honestly.
- KV is eventually consistent, not an atomic database. This single daily writer avoids frequent conflicting writes. A failed KV put is reported as a failed run; no delete precedes it.
- Missing/unavailable cache returns 503 {"status":"unavailable"}; stale data remains 200 with fetchedAt in JSON and X-Snapshot-Stale. The site keeps its static snapshot if the endpoint fails, rejects invalid/example/oversized data, and only replaces it with a newer verified-shaped snapshot.
- ALLOWED_ORIGINS is a comma-separated list of exact origins, no paths or wildcard. An Origin request not in the list receives403 before KV reads. CORS headers are applied after cache lookup and are never stored in the shared cached response. Responses use Vary: Origin and no-store; the separate internal edge cache remains shared safely.
- CORS is not authentication or bot prevention. Non-browser clients can omit/spoof Origin and read this public data. Do not claim it prevents quota abuse. Public traffic still consumes Worker requests and cache misses consume KV reads.

## Free-plan budget and validation limits

Target Workers Free and KV Free, without opting into paid services. Official Worker limits currently list 10ms CPU for Free HTTP and Cron handlers; wall-clock fetch waiting differs from CPU time. JSON payloads are capped at100,000bytes, the calendar has about365days, GET avoids full parsing, and cron runs once a day. This is a design target, not a measured Cloudflare CPU guarantee. A daily request or cache does not guarantee staying under free quotas under heavy/abusive traffic; monitor the account and stop/review if limits are reached, never silently upgrade.

Node tests mock KV, Cache API and fetch. They are not Miniflare/workerd execution, real Cron timing, real cross-origin browser testing, or CPU measurements. No restrictions were bypassed to run a browser/runtime. Deployment must verify actual CPU, storage propagation, CORS and the scheduled handler before declaring live automation working.

## Deployment checklist (owner-controlled, not performed)

1. Confirm the free-plan resource/deployment scope. Create a KV namespace in the intended Cloudflare account.
2. Copy wrangler.toml.example to ignored wrangler.toml. Fill the real namespace ID. Fill ALLOWED_ORIGINS with the exact verified blog origin and any specifically needed preview origin; do not allow all *.pages.dev.
3. Review the scheduled trigger. Deploy using the owner's own supported Cloudflare session/tooling. Creating/deploying resources and signing in are separate approval steps; this repository does not automate them.
4. The owner sets GITHUB_TOKEN as a Worker Secret directly through Cloudflare's secure UI or supported interactive secret command. The value is never stored in wrangler.toml. Use the narrowest public-read capability that GitHub's GraphQL API accepts; no repository write scope is needed. Actual PAT capability must be checked with this worker before claiming it works.
5. Initialize KV manually as below, or let the first Cron fill it. Before initialization GET503 is expected; the blog still shows its static fallback.
6. Verify the deployed GET URL, real calendar totals, allowed/disallowed origins, metadata timestamps, and Cron run logs. Ensure error logs do not contain response bodies or tokens.
7. Only then set [contributions].endpoint in config/_default/params.toml to the verified HTTPS URL ending exactly /api/contributions. Commit through the normal reviewed site workflow. Leaving it empty makes no browser API request; no fictitious endpoint is included.
8. Check the first real scheduled refresh and subsequent browser update. Without successful deployment, Secret setup, binding and endpoint configuration, daily updates are not enabled.

## Manual initialization without a public refresh endpoint

Use the existing verified static snapshot as initial cache; it retains its actual original fetchedAt, not the upload time. From repository root run:

    node workers/contributions/prepare-seed.cjs

This only writes ignored local files .cache/contribution-seed/value.json and metadata.json. Review them. With the owner's approved Cloudflare tooling/session, from workers/contributions run:

    npx wrangler kv key put "github:Wang060919:v1" --binding CONTRIBUTIONS --path ../../.cache/contribution-seed/value.json --metadata "$(cat ../../.cache/contribution-seed/metadata.json)" --remote

The owner performs any login and installation prompts. This command is documentation, not an executed deployment. It uploads public aggregated JSON and its actual timestamp only. There is no credential in the value. Do not set expiration. Alternatively enter the same key/value/metadata in the account's supported KV management UI. The subsequent scheduled refresh replaces this seed only after validation.

For local tests, npm test at the repository root includes deterministic Worker/cache tests. Local wrangler dev --test-scheduled can be used by the owner after authorized tooling setup, but local scheduled testing must not be mistaken for production Cron execution.

## Sources

- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- https://developers.cloudflare.com/kv/api/write-key-value-pairs/
- https://developers.cloudflare.com/kv/reference/kv-commands/
- https://developers.cloudflare.com/workers/runtime-apis/cache/
- https://docs.github.com/en/graphql/reference/users#contributioncalendar
