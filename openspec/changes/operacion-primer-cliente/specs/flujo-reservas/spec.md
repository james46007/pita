# Spec Delta: flujo-reservas

## ADDED Requirements

### Requirement: Walk-in and cash reservation lifecycle
The system SHALL support creating reservations directly in `CONFIRMED` status when initiated by authorized venue staff for walk-in or phone customers without requiring an image receipt.

#### Scenario: Immediate confirmation for cash booking
- **WHEN** staff submits a manual reservation marked as cash or paid on-site
- **THEN** the system creates the `Booking` record with `CONFIRMED` status and associates it atomically with the selected slot without setting an expiration timer or requiring a receipt URL.

#### Scenario: Financial metrics reflection
- **WHEN** a manual reservation is confirmed
- **THEN** its total amount is automatically included in the complex's confirmed revenue and occupancy calculations.
