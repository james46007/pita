# Design: Operación Primer Cliente (GTM Readiness)

## Context

The current reservation flow is strictly customer-initiated and asynchronous (create reservation -> upload bank receipt -> wait for staff approval). Real sports clubs operate in a hybrid environment where 30% to 50% of bookings happen through phone calls or walk-ins, and players communicate via WhatsApp. Additionally, the domain root (`/`) displays Next.js boilerplate rather than a commercial product presentation.

## Goals / Non-Goals

**Goals:**
- Enable staff to register and immediately confirm walk-in / phone reservations from `/dashboard/reservas`.
- Provide a 1-click WhatsApp confirmation link generator for confirmed bookings.
- Provide a pending receipt notification badge on the sidebar "Reservas" navigation item.
- Replace default Next.js starter page with a modern, high-converting commercial landing page at `/`.

**Non-Goals:**
- External WhatsApp Cloud API or Twilio integration (direct `wa.me` link generator requires zero API setup, credentials, or fees).
- Online credit card payment gateway integration (deferred to future billing phase).

## Decisions

### 1. Atomic Transaction for Manual Bookings
- **Decision**: Create an endpoint `POST /api/dashboard/reservas/manual` wrapped in `prisma.$transaction`:
  1. Verify slot belongs to court, court belongs to the staff's complex, and slot is currently `AVAILABLE`.
  2. Create `Booking` with `status: BookingStatus.CONFIRMED`, `notes: "Manual reservation (Cash / On-site)"`, `customerName`, `customerPhone`.
  3. Update `Slot` status to `SlotStatus.BOOKED`.
- **Rationale**: Prevents double-booking race conditions and keeps database integrity consistent with regular bookings.

### 2. WhatsApp Message Generator Utility
- **Decision**: Implement a client-side helper function `generateWhatsAppConfirmationUrl({ customerPhone, customerName, complexName, courtName, date, startTime, endTime, totalAmount })`.
  - Normalizes phone numbers (removes `+`, `-`, spaces).
  - Uses standard `encodeURIComponent` to craft a friendly, polite message.
- **Rationale**: Completely free, works natively on both mobile (WhatsApp App) and desktop (WhatsApp Web).

### 3. Pending Receipt Counter Architecture
- **Decision**: In `src/app/dashboard/layout.tsx`, fetch count of bookings with `complexId` and `status: BookingStatus.RECEIPT_UPLOADED`. If count > 0, display a vibrant amber/red pill badge next to "Reservas".
- **Rationale**: Server component execution avoids client-side waterfall requests and provides instant visibility upon loading the dashboard.

### 4. High-Impact Commercial Landing Page
- **Decision**: Redesign `src/app/page.tsx` with a modern dark/light sports aesthetic:
  - Hero with value proposition ("Digitaliza tu club de pádel y fútbol").
  - Core features grid (Automated calendar, WhatsApp notifications, anti-overbooking, revenue reports).
  - Direct action links: Player Login (`/login-cliente`), Club Admin Login (`/login`), and Public Venue Directory/Demo.

## Risks / Trade-offs

- **[Invalid phone numbers entered manually]** → Add basic regex/length validation in the manual booking dialog before generating WhatsApp links.
