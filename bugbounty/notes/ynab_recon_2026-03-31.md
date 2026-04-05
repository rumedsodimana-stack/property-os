# YNAB Recon Note

Date: 2026-03-31
Program: `YNAB` on Bugcrowd
Program URL: `https://bugcrowd.com/engagements/ynab`

## Why This Target

- Public Bugcrowd program
- Clear staging scope
- Better first-hunt fit than production-heavy programs
- Reward chart is usable:
  - `P1 $3000`
  - `P2 $1350`
  - `P3 $800`
  - `P4 $150`

## Scope Notes

In scope targets reviewed from the brief:

- `staging-app.bany.dev`
- `https://staging-api.bany.dev/`
- `https://www.ynab.com/`
- `*.ynab.com` except explicitly out of scope

Important out-of-scope items:

- `https://app.ynab.com/` production app
- mobile apps
- support / learn properties
- non-listed properties
- aggressive automated scanning
- real customer data / real customer accounts
- user enumeration
- clickjacking
- most TLS / SSL-only issues

## Safe Recon Performed

### 1. Staging App Header Check

Request:

```bash
curl -I https://staging-app.bany.dev
```

Observed:

- `302` redirect to `/users/sign_in`
- staging CSP present
- Heroku + Cloudflare in front
- strict transport security enabled

### 2. Staging API Docs Root

Request:

```bash
curl -I https://staging-api.bany.dev/v1
curl https://staging-api.bany.dev/v1
```

Observed:

- `200 OK`
- API docs are publicly reachable
- page bootstraps a Scalar API reference
- docs load spec from `/papi/open_api_spec.yaml`

### 3. OpenAPI Spec Discovery

Request:

```bash
curl https://staging-api.bany.dev/papi/open_api_spec.yaml
```

Observed:

- OpenAPI version `3.1.1`
- API version `1.81.0`
- server listed as `https://api.ynab.com/v1`
- bearer auth expected
- documented endpoints include:
  - `/user`
  - `/plans`
  - `/plans/{plan_id}`
  - `/plans/{plan_id}/settings`
  - `/plans/{plan_id}/accounts`

### 4. robots.txt

Requests:

```bash
curl https://staging-app.bany.dev/robots.txt
curl https://staging-api.bany.dev/robots.txt
```

Observed:

- both return:
  - `User-agent: *`
  - `Disallow: /`

### 5. Unauthenticated API Boundary

Requests:

```bash
curl -i https://staging-api.bany.dev/v1/user
curl -i -H 'Origin: https://example.com' https://staging-api.bany.dev/v1/user
```

Observed:

- unauthenticated request returns `401`
- response includes `WWW-Authenticate: Bearer ... invalid_token`
- no obvious permissive CORS header was reflected for the foreign origin in this check

## Current Assessment

- The target is behaving cleanly on first-pass unauthenticated checks
- The staging API docs and spec give a solid map for careful next-step testing

Update:

- A more concrete candidate issue was found on the staging app:
  - public webpack source maps are accessible
  - `sourcesContent` is embedded
  - auth-related TypeScript modules are exposed
- Draft report saved at:
  - `/Users/rumedsodimana/Desktop/Hotel_Singularity_OS_Source/bugbounty/reports/ynab_staging_source_map_disclosure_2026-03-31.md`

## Auth Access Attempt

Tried to create authorized staging test accounts using the Bugcrowd alias patterns referenced in the brief:

- `rumedsodimana@bugcrowdninja.com`
- `rumedsodimana+2@bugcrowdninja.com`

Observed result in both browser-backed signup attempts:

- response status: `422`
- error id: `email_signup_not_allowed_castle`
- message: `Sign up is not allowed. Contact support for assistance.`

Current interpretation:

- this is not enough to claim a security issue
- it may be an anti-fraud or email-alias acceptance problem
- before treating this as a target-side defect, the Bugcrowd alias itself should be validated independently

## Next Low-Risk Steps

1. Create a Bugcrowd Ninja account for YNAB staging access if needed.
2. Validate that the Bugcrowd alias is forwarding and active.
3. Review the full OpenAPI spec for unusual write paths and state transitions.
4. Perform slow, non-aggressive authenticated testing on staging only.
5. Check for auth edge cases, plan/account object authorization, and business-logic gaps.
