# Tasks

## 1. Data Models and Environment Configuration

- [x] 1.1 Add `ComplexWhatsappConfig` and `WhatsappOutboundMessage` models to `prisma/schema.prisma` and verify generation with `npx prisma generate`
- [x] 1.2 Apply database schema updates via `npx prisma db push` and verify tables exist without disrupting existing data
- [x] 1.3 Add `EVOLUTION_API_URL` and `EVOLUTION_API_KEY` to `.env.example` and local `.env`

## 2. Backend Services and Utilities

- [x] 2.1 Implement E.164 phone normalization and validation in `src/lib/whatsapp/phone.ts` and verify unit test cases (Ecuador '09...', international with '+', invalid numbers)
- [x] 2.2 Implement Evolution API client in `src/lib/whatsapp/evolution.ts` (create instance, fetch QR, connection status, number check, and send message) and verify typed responses
- [x] 2.3 Implement anti-ban template variation generator in `src/lib/whatsapp/templates.ts` with dynamic placeholder substitution

## 3. Management API Endpoints and Webhooks

- [x] 3.1 Create `POST` and `DELETE` endpoints in `src/app/api/dashboard/whatsapp/instance/route.ts` guarded by `assertAdminOnly` to initiate pairing (generate QR) and logout
- [x] 3.2 Create `GET` endpoint in `src/app/api/dashboard/whatsapp/status/route.ts` to inspect current instance state and paired phone number
- [x] 3.3 Create public webhook endpoint `POST /api/webhooks/whatsapp/route.ts` to handle Evolution API `connection.update` events

## 4. Booking Confirmation Integration and Queue Processing

- [x] 4.1 Update `src/app/api/dashboard/reservas/[id]/route.ts` to enqueue `WhatsappOutboundMessage` with 3–8s random delay upon transition to `CONFIRMED`
- [x] 4.2 Create cron worker endpoint `GET /api/cron/whatsapp-queue/route.ts` protected by `assertCronAuthorized`, processing 1 message per run with exponential backoff and expired slot purging
- [x] 4.3 Integrate fire-and-forget keep-alive ping to Render within `GET /api/cron/whatsapp-queue/route.ts`
- [x] 4.4 Add `whatsapp-queue` cron task to `vercel.json` with 1-minute schedule (`* * * * *`)

## 5. Dashboard Frontend and Navigation

- [x] 5.1 Add "WhatsApp" navigation link with green icon to sidebar in `src/app/dashboard/layout.tsx`
- [x] 5.2 Build main management page `src/app/dashboard/whatsapp/page.tsx` displaying connection health, outbound delivery log, and role-based action gating (ADMIN vs STAFF)
- [x] 5.3 Build `src/components/dashboard/whatsapp/QrModal.tsx` component with countdown timer, manual QR refresh, and status polling until connection
- [x] 5.4 Build manual test message modal allowing administrators to verify immediate delivery to their own phone

## 6. End-to-End Verification

- [x] 6.1 Validate Next.js and TypeScript project compilation without errors via `npm run build`
- [x] 6.2 Test end-to-end flow: instance initialization, QR presentation, connection state transition, and message enqueueing upon payment confirmation
