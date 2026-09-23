# Design

## Context

The Pita application manages reservations and payments for multi-tenant sports complexes, deployed on Vercel (Next.js App Router) with PostgreSQL on Supabase managed via Prisma. Evolution API (v2 / Baileys engine) is hosted on Render (Free tier). See `proposal.md` for motivation.

Key environment constraints:
- **Render Free Tier**: Suspends after 15 minutes of inbound HTTP inactivity; cold starts require 45–60 seconds to resume.
- **Vercel Serverless Free Tier**: Strict 10-second execution timeout per function/cron invocation.
- **Meta / WhatsApp Anti-Spam Detection**: Rapid bursts or identical message texts sent in sub-second intervals trigger anti-bot heuristics, particularly on newer or business-unverified numbers.

## Goals / Non-Goals

**Goals:**
- Provide a decoupled architecture where booking confirmation in the dashboard does not synchronously block on Evolution API availability.
- Completely isolate WhatsApp sessions per sports complex using a dedicated 1:1 relation (`ComplexWhatsappConfig`).
- Implement a transactional database queue (`WhatsappOutboundMessage`) with idempotency, exponential backoff, and resilience against Render cold starts.
- Guarantee that Vercel Cron executions never exceed the 10-second timeout limit by processing a single message per cycle and simulating human pacing via scheduled `nextRetryAt` delays.
- Keep the Render Evolution API container awake by embedding lightweight keep-alive pings into the cron execution loop.

**Non-Goals:**
- Inbound two-way conversational routing or automated customer support chatbot (customer replies go directly to the owner's WhatsApp mobile app).
- Promotional mass broadcasting or unsolicited marketing campaigns.
- Direct integration with Meta WhatsApp Cloud API (Evolution API / Baileys is used according to user infrastructure).

## Decisions

### 1. Dedicated Data Models (`ComplexWhatsappConfig` and `WhatsappOutboundMessage`)
- **Decision**: Create two isolated Prisma models.
  - `ComplexWhatsappConfig`: Stores `instanceName` (`pita_complex_[cuid]`), state (`DISCONNECTED`, `CONNECTING`, `CONNECTED`), paired phone number, and optional custom template.
  - `WhatsappOutboundMessage`: Queue table with `@@unique([bookingId])`, status (`PENDING`, `SENT`, `FAILED_PERMANENT`), `attempts` counter, `nextRetryAt`, and `lastError`.
- **Alternative considered**: Storing fields directly on `Complex`. Discarded to maintain clean domain boundaries and permit independent lifecycle and message audit logging.

### 2. Asynchronous Enqueueing and Idempotency
- **Decision**: When an administrator confirms a reservation in `PATCH /api/dashboard/reservas/[id]`, perform an `upsert` on `WhatsappOutboundMessage` setting `nextRetryAt = now() + random(3..8) seconds`. The API responds immediately without blocking the UI or waiting on Evolution API.
- **Alternative considered**: Calling Evolution API synchronously in the `PATCH` handler. Discarded because Render cold starts or network latency would cause frequent timeouts and failed booking confirmations.

### 3. Single-Message Queue Processing per Cron Invocation
- **Decision**: The `/api/cron/whatsapp-queue` endpoint (running every 1 minute) fetches the oldest eligible pending message ordered by `nextRetryAt asc`, verifies instance readiness, and processes at most 1 delivery per invocation.
- **Rationale**: Validating recipient status and dispatching text typically consumes 1–3 seconds. Processing 1 message per run guarantees remaining well under Vercel's 10-second ceiling and naturally spaces outbound traffic to avoid spam velocity triggers.

### 4. Anti-Ban Measures and Template Rotation
- **Decision**:
  - Dynamically select between 3–4 syntactic template variations containing player name, court, date, and time.
  - Validate recipient WhatsApp presence through Evolution API before dispatching.
  - If a number is invalid, transition immediately to `FAILED_PERMANENT` without wasting retries.

### 5. Fault Tolerance and Intelligent Pausing
- **Decision**:
  - Upstream/Network failures: Retry with exponential backoff (attempt 1: 2 min, attempt 2: 8 min, attempt 3: 30 min). After 3 failures, transition to `FAILED_PERMANENT`.
  - Disconnected instance or suspended subscription: Postpone via `nextRetryAt = now() + 1 hour` without incrementing `attempts`. When reconnected, queued messages process cleanly.
  - If the slot start time has already elapsed (`slot.startTime < now()`), transition the record to `EXPIRED` to prevent sending stale notifications.

### 6. Integrated Keep-Alive Ping for Render Free Tier
- **Decision**: Each execution of `/api/cron/whatsapp-queue` issues a lightweight fire-and-forget fetch with a 2.5s timeout to `GET ${EVOLUTION_API_URL}/`. This keeps the Render container warm and prevents cold start delays without external monitoring dependencies.

### 7. Layered Connection State Synchronization (Webhook + Polling Fallback)
- **Decision**:
  - **Layer 1**: Webhook endpoint `POST /api/webhooks/whatsapp` processing `connection.update` events from Evolution API to immediately update database state.
  - **Layer 2**: While the QR pairing modal is open, the client polls `GET /api/dashboard/whatsapp/status` every 3 seconds as a fallback, automatically closing upon detecting `CONNECTED`.

### 8. Authorization and Access Control
- **Decision**: All mutation actions (create instance, request QR, disconnect, edit templates) are guarded with `assertAdminOnly`. `STAFF` users receive read-only access to view connection health.

## Risks / Trade-offs

- **[Risk: Render session loss if Evolution API uses ephemeral local storage]** → Mitigation: Ensure `DATABASE_PROVIDER=postgresql` or `DATABASE_URL` is set in Evolution API Render environment variables so WhatsApp auth state survives container restarts.
- **[Risk: Stale queue buildup during prolonged disconnection]** → Mitigation: Automatic expiration (`EXPIRED`) for messages whose scheduled booking slot has already passed.
- **[Risk: Exceeding 750 free hours on Render]** → Mitigation: Document that Evolution API should be the single active service on the free Render account to remain within the monthly free tier allowance.

## Migration Plan

1. Update `prisma/schema.prisma` with `ComplexWhatsappConfig` and `WhatsappOutboundMessage`.
2. Generate and apply Prisma migrations (`npx prisma generate` and `npx prisma db push`).
3. Add `EVOLUTION_API_URL` and `EVOLUTION_API_KEY` to `.env` and Vercel configuration.
4. Implement phone normalizer (`src/lib/whatsapp/phone.ts`) and Evolution API client (`src/lib/whatsapp/evolution.ts`).
5. Build management, webhook, and cron API routes.
6. Update `PATCH /api/dashboard/reservas/[id]` to enqueue confirmation messages.
7. Register `/api/cron/whatsapp-queue` (`* * * * *`) in `vercel.json`.
8. Implement the `/dashboard/whatsapp` page, QR modal, and sidebar navigation link.
