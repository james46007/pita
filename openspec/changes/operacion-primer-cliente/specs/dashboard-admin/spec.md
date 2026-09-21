# Spec Delta: dashboard-admin

## ADDED Requirements

### Requirement: Manual quick-booking creation
The system SHALL allow ADMIN and STAFF users to create a booking directly from `/dashboard/reservas` for in-person or telephone reservations.

#### Scenario: Admin creates a confirmed manual booking
- **WHEN** the staff opens the "Nueva Reserva Manual" dialog, selects an available slot for a court, enters customer name, customer phone, selects payment method as cash/on-site, and submits
- **THEN** the system creates the booking with status `CONFIRMED`, marks the slot as `BOOKED`, and displays the booking in the reservations list.

#### Scenario: Validation of occupied slot
- **WHEN** the staff attempts to manually book a slot that is already booked or blocked
- **THEN** the system prevents submission and alerts the staff that the slot is unavailable.

### Requirement: Direct WhatsApp confirmation link
The system SHALL provide a 1-click action on confirmed bookings to open a pre-filled WhatsApp message directed to the player's phone number.

#### Scenario: Generate WhatsApp message link
- **WHEN** the staff clicks "Enviar WhatsApp" on a confirmed booking
- **THEN** the system opens a `https://wa.me/{phone}` URL containing pre-encoded booking confirmation text with customer name, court name, date, time slot, and total amount.

### Requirement: Pending receipt inbox counter
The system SHALL display an indicator badge in the dashboard sidebar showing the total count of bookings with status `RECEIPT_UPLOADED` waiting for staff review.

#### Scenario: Highlight unreviewed receipts
- **WHEN** one or more bookings are in `RECEIPT_UPLOADED` status for the active complex
- **THEN** the "Reservas" sidebar navigation item displays a badge with the count of pending receipts.
