## Purpose

Allows administrators to define courts available in their sports complex (type, price, slot duration) and configure weekly operational schedules that determine when reservations can take place.

## ADDED Requirements

### Requirement: Court CRUD operations
The system SHALL allow the ADMIN to create, update, deactivate, and list courts for their complex with the following fields: name, type (PADEL / SINTETICA), price per hour, and slot duration in minutes.

#### Scenario: Create court
- **WHEN** the ADMIN submits valid name, type, precioHora, and duracionSlotMin
- **THEN** the system creates an active court associated with the ADMIN's complex

#### Scenario: Deactivate court
- **WHEN** the ADMIN deactivates a court
- **THEN** the system flags it as inactive and excludes it from the public booking interface

### Requirement: Weekly schedule configuration
The system SHALL allow the ADMIN to define availability schedules per court and day of the week (0=Sunday … 6=Saturday), specifying opening and closing times.

#### Scenario: Define schedule by day
- **WHEN** the ADMIN creates a schedule for a court on a given day of the week
- **THEN** the system persists the operational time window for that day

#### Scenario: Distinct schedules per day
- **WHEN** the ADMIN configures different hours for Monday and Saturday on the same court
- **THEN** the system stores both intervals independently

### Requirement: Public rate visibility
The system SHALL display the hourly rate of each court in the public slot selection view.

#### Scenario: Customer sees price
- **WHEN** a visitor browses available slots for a court
- **THEN** the system includes the `precioHora` in the response
