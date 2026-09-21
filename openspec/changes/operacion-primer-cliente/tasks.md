# Tasks: Operación Primer Cliente (GTM Readiness)

## 1. Backend & Data Operations

- [ ] 1.1 Create `src/app/api/dashboard/reservas/manual/route.ts` executing atomic reservation creation with `BookingStatus.CONFIRMED` and slot transition to `SlotStatus.BOOKED`. Verify response returns created booking.
- [ ] 1.2 Add pending receipts count query to `src/app/dashboard/layout.tsx` filtering by `BookingStatus.RECEIPT_UPLOADED` for the current tenant. Verify count is passed to sidebar navigation.

## 2. Dashboard & WhatsApp Integrations

- [ ] 2.1 Implement the "Nueva Reserva Manual" button and dialog in `src/app/dashboard/reservas/page.tsx` allowing staff to pick court, date, available slot, customer name, phone, and submit without receipt upload. Verify slot is claimed.
- [ ] 2.2 Add "Confirmar por WhatsApp" action button and URL generator helper on confirmed bookings in `src/app/dashboard/reservas/page.tsx`. Verify generated `wa.me` URL contains formatted message text.
- [ ] 2.3 Render the pending receipt counter badge in the dashboard sidebar navigation next to "Reservas". Verify badge shows when receipts are pending.

## 3. Commercial Landing Page

- [ ] 3.1 Redesign `src/app/page.tsx` replacing the starter boilerplate with a modern commercial landing page featuring club value proposition, feature highlights, and direct action buttons for players and administrators. Verify responsive presentation.

## 4. Verification & Validation

- [ ] 4.1 Run `npm run build` or `pnpm exec tsc --noEmit` to verify type safety and build integrity with zero warnings or errors.
- [ ] 4.2 Verify manual booking creation end-to-end and confirm the new booking immediately reflects in `/dashboard/metricas` revenue totals.
