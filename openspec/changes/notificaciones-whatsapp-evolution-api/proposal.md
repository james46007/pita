# Proposal

## Why

Currently, sports complex owners must manually send booking confirmations via WhatsApp by opening `wa.me` links, or rely exclusively on emails which suffer from lower immediate open rates. Integrating WhatsApp directly via Evolution API enables each sports complex owner to connect their own WhatsApp account by scanning a QR code and automate confirmation message delivery as soon as payment is confirmed, ensuring instant communication and significantly reducing operational friction.

## What Changes

- **Multi-tenant WhatsApp Linking**: Each sports complex can pair and unpair its dedicated WhatsApp number by scanning a dynamically generated QR code via Evolution API directly from the admin dashboard.
- **Configuration & Outbound Queue Data Models**: Introduction of `ComplexWhatsappConfig` (instance state, credentials, paired phone) and `WhatsappOutboundMessage` (outbound message queue with retry controls, idempotency, and exponential backoff).
- **Intelligent Phone Number Normalization**: Default support for Ecuador formatting (`+593` / `09` and `9` prefixes) extensible to international E.164 formats before dispatch.
- **Asynchronous Enqueueing with Anti-Ban Protections**: Booking confirmation enqueues notifications with non-blocking delays and syntactic template variations, processed by a cron job adhering to Vercel's 10-second timeout limit and providing keep-alive pings to Render.
- **Connection Lifecycle Webhook & Polling Fallback**: Real-time handling of connection events from Evolution API (`open`, `close`, `connecting`) combined with graceful polling while the QR modal is active.
- **Role-Based Access Control**: Only `ADMIN` users can pair, unpair, or modify WhatsApp settings; `STAFF` users have read-only visibility into connection status.

## Capabilities

### New Capabilities
- `notificaciones-whatsapp`: Per-complex WhatsApp instance management via Evolution API, QR code pairing, recipient normalization, and resilient outbound message queue processing with automatic retries.

### Modified Capabilities
<!-- No modified capabilities - existing specs retain their core requirements -->

## Impact

- **Database**: New Prisma models `ComplexWhatsappConfig` and `WhatsappOutboundMessage`.
- **API Routes**:
  - `POST /api/dashboard/whatsapp/instance` (create/reconnect instance and fetch QR code).
  - `DELETE /api/dashboard/whatsapp/instance` (disconnect/logout session).
  - `GET /api/dashboard/whatsapp/status` (query instance state and paired phone number).
  - `POST /api/webhooks/whatsapp` (receive connection lifecycle events from Evolution API).
  - `GET /api/cron/whatsapp-queue` (process pending queue messages, retries, and keep-alive ping to Render).
  - `PATCH /api/dashboard/reservas/[id]` (enqueue confirmation WhatsApp upon setting status to `CONFIRMED`).
- **User Interface**:
  - New sidebar navigation item: "WhatsApp".
  - Main management view (`/dashboard/whatsapp`) with connection status, QR pairing modal, test message dispatch, and notification delivery history.
- **Environment Variables**:
  - `EVOLUTION_API_URL` (Base URL of Evolution API service on Render).
  - `EVOLUTION_API_KEY` (Global authentication API key for Evolution API).
  - `CRON_SECRET` (Authorization secret protecting the queue cron endpoint).
