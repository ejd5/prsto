# ELTON OS — Security Headers

## Current (Dev)

Applied via `middleware.ts`:

| Header | Value |
|--------|-------|
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), interest-cohort=()` |

## Production (Add when deploying)

In `next.config.ts` or production middleware:

```ts
headers: [
  {
    source: '/:path*',
    headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
    ],
  },
]
```

## CSP Notes

A full Content-Security-Policy is **not enabled by default** to avoid breaking:
- Next.js dev server (inline scripts, eval for HMR)
- Chrome extension CORS to localhost:3000
- PDF preview via blob/data URIs
- External image hosts (LinkedIn, Indeed)

**When ready**, add a CSP with these directives:
```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';  # Next.js needs unsafe-eval in dev
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https:;
connect-src 'self' https:;
frame-ancestors 'none';
```

The `unsafe-inline` and `unsafe-eval` can be removed in production with a proper nonce setup.
