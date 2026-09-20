# dashboard-admin Specification

## Purpose

Private web dashboard accessible at `/dashboard` for ADMIN and STAFF users. Centralizes operational management: daily schedule overview, payment proof review, court management, schedules, and slots.

## Requirements

### Requirement: Daily schedule overview
The system SHALL display to ADMIN and STAFF users on the main dashboard page all bookings for the current day grouped by court, including status and customer information.

#### Scenario: Day agenda with active bookings
- **WHEN** an ADMIN accesses the dashboard
- **THEN** the system displays all bookings for today ordered by start time for their complex

#### Scenario: Day agenda with no bookings
- **WHEN** there are no bookings scheduled for the current day
- **THEN** the system displays an empty-state message indicating no bookings for today

### Requirement: Booking management from dashboard
The system SHALL allow ADMIN and STAFF to review individual booking details, inspect the uploaded payment receipt, and confirm or cancel the booking.

#### Scenario: View payment receipt
- **WHEN** the ADMIN opens a booking in COMPROBANTE_SUBIDO state
- **THEN** the system displays the payment proof image along with Confirm and Cancel action buttons

#### Scenario: Filter bookings by state
- **WHEN** the ADMIN filters bookings by COMPROBANTE_SUBIDO state
- **THEN** the system displays only bookings awaiting review and approval

### Requirement: Manual slot control from dashboard
The system SHALL provide an interface in the dashboard to create individual slots and toggle existing slot states (lock/unlock).

#### Scenario: Create manual slot from dashboard
- **WHEN** the ADMIN selects a court, date, and start/end times from the dashboard
- **THEN** the system creates the slot and updates public availability accordingly

### Requirement: Complex configuration from dashboard
The system SHALL allow the ADMIN to update complex contact info (name, phone, address) and manage bank accounts. This section is RESTRICTED from STAFF users.

#### Scenario: Update complex info
- **WHEN** the ADMIN modifies complex details
- **THEN** the system saves the update and reflects it on public tenant landing pages
