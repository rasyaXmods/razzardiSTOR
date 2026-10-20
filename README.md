# RAZZARDISTORE — backend starter with real provider integration points

This is a **starter implementation**, not a claim that the store is live or production-certified. It contains real API integration code paths for Midtrans Snap and Digiflazz, PostgreSQL/Prisma data models, order lookup, verified Midtrans webhook handling, a Digiflazz webhook handler, and token-protected product admin endpoints.

## Before going live

1. Create a PostgreSQL database and configure `.env` from `.env.example`.
2. Install dependencies with `npm install`.
3. Run `npx prisma generate` and `npx prisma migrate dev --name init` in development; use `npm run db:migrate` for deployment after migrations are committed.
4. Configure production Midtrans credentials and the correct notification URL: `https://YOUR_DOMAIN/api/webhooks/midtrans`.
5. Configure Digiflazz credentials and its webhook URL: `https://YOUR_DOMAIN/api/webhooks/digiflazz`. Verify the signature header format against the current Digiflazz dashboard/API docs before enabling fulfillment.
6. Add products with verified Digiflazz SKU codes and prices using `POST /api/admin/products` with `Authorization: Bearer $ADMIN_API_TOKEN`.
7. Deploy to HTTPS hosting, set `APP_BASE_URL`, configure logs/alerts/backups, and test with provider-approved test credentials before switching to production mode.

## Important production blockers

- **No credentials or hosting are included.** Never paste secret keys into source code or commit `.env`.
- Midtrans webhook verifies the documented signature formula. Confirm the current account's notification behavior and test duplicate/out-of-order notifications.
- **Fulfillment worker is intentionally not implemented.** The Midtrans webhook marks verified payments as `PAID` but does not send a top-up. Before accepting live payments, add a durable queue/worker that atomically claims paid orders, submits a Digiflazz transaction using the product SKU and player ID, persists the provider `ref_id`, retries safely, and reconciles provider status. Do not trigger fulfillment directly from the browser.
- Confirm Digiflazz's currently required webhook authentication/header and callback payload with your account documentation. The provided signature helper is an integration point and must be adapted to the exact configured provider contract.
- Add rate limiting, bot protection, CSRF/origin protections where applicable, admin login with roles/MFA, audit logs, privacy policy, terms, refund policy, and monitoring before launch.
- The starter UI is intentionally minimal; the generated image is a **visual design concept**, not a screenshot of a running application.
- This repository has not been deployed or tested with your live accounts. Do not advertise live transactions until end-to-end payment, webhook, fulfillment, duplicate notification, timeout, refund, and reconciliation tests pass.

## API overview

- `POST /api/orders` — create an order from an active database product and create a Midtrans Snap transaction.
- `GET /api/orders/:publicId` — public order status lookup.
- `POST /api/webhooks/midtrans` — signature-verified payment notification.
- `POST /api/webhooks/digiflazz` — provider callback integration point; adapt signature validation to the actual Digiflazz webhook contract.
- `GET/POST/PATCH /api/admin/products` — bearer-token-protected product management.

## Security note

Never trust a client-supplied price. This starter takes prices from the database, but a complete production checkout must also implement idempotent order creation, payment expiry, payment amount/currency reconciliation, durable fulfillment queue semantics, rate limits, and robust admin authentication.
