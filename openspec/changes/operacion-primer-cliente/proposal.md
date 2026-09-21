# Proposal: Operación Primer Cliente (GTM & First-Customer Readiness)

## Why

To acquire the first real sports complex customer, the platform must accommodate real-world operational workflows where 30% to 50% of bookings occur via phone calls or walk-ins, and communication relies heavily on WhatsApp. Currently, the system lacks manual booking creation from the dashboard, forces receipt uploads, provides no direct WhatsApp confirmation action, and displays default Next.js boilerplate on the root domain (`/`). This change bridges the gap between digital self-service and real-world venue management.

## What Changes

- **Manual Quick-Booking Modal**: Allow venue administrators and staff to create bookings directly from `/dashboard/reservas` selecting court, date, available slot, customer name, phone, and marking payment as cash/on-site with immediate `CONFIRMED` status.
- **WhatsApp 1-Click Confirmation Link**: Add a WhatsApp direct link generator on confirmed bookings (`https://wa.me/{phone}?text=...`) prefilling personalized booking details (complex name, court, date, start/end time, total amount).
- **Pending Receipts Sidebar Badge**: Add a visual counter/badge in the dashboard sidebar on the "Bookings" tab highlighting unreviewed payment receipts (`RECEIPT_UPLOADED`) so staff never miss incoming verifications.
- **Commercial Landing Page (`/`)**: Replace the default Next.js starter page with a high-converting landing page highlighting features for club owners, direct customer booking search, and login/register calls to action.

## Capabilities

### Modified Capabilities
- `dashboard-admin`: Adds manual quick-booking dialog, WhatsApp message action, and pending receipts badge counter to `/dashboard`.
- `flujo-reservas`: Adds support for staff-created walk-in bookings that transition directly to `CONFIRMED` without requiring receipt image uploads.

## Impact
- **APIs**: New `POST /api/dashboard/reservas/manual` endpoint; count endpoint or extended metadata for pending receipts.
- **UI**: Updated `src/app/dashboard/reservas/page.tsx`, `src/app/dashboard/layout.tsx`, and `src/app/page.tsx`.
- **Database**: No schema migrations; reuses `Booking` with `status: CONFIRMED` and `notes` describing manual creation.
