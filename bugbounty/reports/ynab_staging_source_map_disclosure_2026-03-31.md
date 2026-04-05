# YNAB Staging Source Map Disclosure

Date: 2026-03-31
Program: YNAB Bugcrowd
Target: `staging-app.bany.dev`
Status: Draft

## Suggested Title

Public webpack source maps on YNAB staging auth pages expose embedded TypeScript source content

## Candidate Severity

`P4 / low` information disclosure

Reasoning:

- publicly accessible source maps are available on an in-scope staging host
- the maps contain embedded `sourcesContent`, not just filenames
- exposed content includes internal TypeScript modules and front-end auth/signup logic
- this can materially reduce attacker effort for analyzing flows, client logic, and defensive controls

## Summary

The YNAB staging application publicly exposes webpack `.js.map` files for authentication-related bundles. These source maps are accessible without authentication and include embedded `sourcesContent`.

At minimum, the `application` bundle source map contains `37` source entries with embedded code for files such as:

- `app/javascript/controllers/signup_controller.ts`
- `app/javascript/controllers/login_controller.ts`
- `app/javascript/lib/castle.ts`
- `app/javascript/lib/googleIdentity.ts`
- `app/javascript/lib/oauth.ts`
- `app/javascript/lib/kustomer_chat.ts`

This discloses internal client-side source code and implementation details that are not otherwise intended to be exposed through the minified production-style bundle alone.

## Steps To Reproduce

1. Visit the in-scope staging login page:

```text
https://staging-app.bany.dev/users/sign_in
```

2. View the page source or load the login HTML and note the referenced webpack asset:

```text
/assets/packs/js/application-9d61448b225c28209bbe.js
```

3. Request the corresponding source map directly:

```text
https://staging-app.bany.dev/assets/packs/js/application-9d61448b225c28209bbe.js.map
```

4. Observe that the response returns `HTTP 200` and a JSON source map.

5. Parse the source map and confirm:

- `sources` count is `37`
- `sourcesContent` is present
- embedded source files include internal TypeScript modules such as:

```text
webpack://ynab_api/./app/javascript/controllers/signup_controller.ts
webpack://ynab_api/./app/javascript/controllers/login_controller.ts
webpack://ynab_api/./app/javascript/lib/castle.ts
```

6. Example excerpt from embedded source content recovered from the map:

```ts
import { createCastleRequestToken, setXhrCastleRequestToken } from "../lib/castle";

export default class extends Controller {
    declare formTarget: HTMLFormElement;
    declare googleButtonTarget: HTMLFormElement;
    declare appleButtonTarget: HTMLFormElement;
    declare submitButtonTarget: HTMLInputElement;
    declare agreementCheckboxTarget: HTMLInputElement;
```

## Evidence

Confirmed accessible from unauthenticated requests:

- `https://staging-app.bany.dev/assets/packs/js/runtime-796f5ca3e9ae363a70db.js.map`
- `https://staging-app.bany.dev/assets/packs/js/application-9d61448b225c28209bbe.js.map`
- `https://staging-app.bany.dev/assets/packs/js/692-9c1dfda28a67a79373df.js.map`

Observed response characteristics:

- status: `200 OK`
- content type: `text/plain`
- cache control: long-lived public caching

## Impact

Public source maps lower the cost of reverse engineering the staging application by exposing:

- original source paths
- embedded source content
- auth and signup client-side logic
- implementation details around SSO, Castle integration, and other front-end flows

Even though this is a staging environment, the brief explicitly places `staging-app.bany.dev` in scope. The disclosed code can help an attacker analyze application behavior and identify follow-on weaknesses faster than with minified bundles alone.

## Remediation

- disable public serving of source maps on internet-accessible staging environments unless they are intentionally exposed
- if source maps are required internally, gate them behind authentication or IP restriction
- ensure build pipelines do not publish `sourcesContent` for publicly reachable environments

## Reproduction Notes

Local validation on 2026-03-31 confirmed:

- source maps were retrievable without authentication
- embedded `sourcesContent` was present
- auth-related TypeScript modules were recoverable from the returned map
