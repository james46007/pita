## Purpose

Manages time slots available for booking on each court. Slots can be generated automatically from weekly operational schedules or created/locked manually by administrators. The unique database constraint guarantees that no two bookings can ever exist for the same slot (anti-overbooking).

## ADDED Requirements

### Requirement: Automated slot generation
The system SHALL generate time slots derived from the court's weekly schedules whenever an administrator triggers availability generation for a date range.

#### Scenario: Generate slots for a week
- **WHEN** the ADMIN requests slot generation for court X between 2024-01-01 and 2024-01-07
- **THEN** the system creates slot records in DISPONIBLE state for each valid interval according to configured schedules, without duplicating existing slots

#### Scenario: Day without configured schedule
- **WHEN** slot generation is triggered for a day lacking schedule definitions
- **THEN** the system creates zero slots for that day

### Requirement: Manual slot creation
The system SHALL allow the ADMIN to create individual slots for a court on a specific date and time.

#### Scenario: Create manual slot
- **WHEN** the ADMIN creates a slot for court X, date Y, horaInicio Z
- **THEN** the system creates the slot in DISPONIBLE state if no slot exists for that combination

#### Scenario: Duplicate slot conflict
- **WHEN** the ADMIN attempts to create a slot with identical (canchaId, fecha, horaInicio)
- **THEN** the system rejects the operation with HTTP 409 Conflict

### Requirement: Slot locking
The system SHALL allow the ADMIN to toggle slot status to BLOQUEADO to prevent customer bookings (court maintenance, tournaments, holidays).

#### Scenario: Lock available slot
- **WHEN** the ADMIN locks a DISPONIBLE slot
- **THEN** the system updates its state to BLOQUEADO and excludes it from public availability queries

#### Scenario: Lock already reserved slot
- **WHEN** the ADMIN attempts to lock a RESERVADO slot
- **THEN** the system rejects the operation with HTTP 422 Unprocessable Entity stating an active booking exists

### Requirement: Public availability query
The system SHALL expose DISPONIBLE slots for a given court and date via an unauthenticated public API.

#### Scenario: Query availability
- **WHEN** a visitor queries available slots for court X on date Y
- **THEN** the system returns exclusively DISPONIBLE slots, including horaInicio, horaFin, and calculated total amount

### Requirement: Database-enforced anti-overbooking
The system SHALL guarantee at database level that duplicate bookings cannot exist for the same slot, using a unique compound index `(canchaId, fecha, horaInicio)` on the Slot model and a 1:1 relation between Slot and Reserva.

#### Scenario: Concurrent double-booking attempt
- **WHEN** two customers attempt to book the exact same slot concurrently
- **THEN** exactly one transaction succeeds; the second receives HTTP 409 Conflict indicating the slot is no longer available
