## Purpose

Defines the complete reservation lifecycle: from slot selection by a player to final admin confirmation upon validating bank transfer receipts. Supports both guest visitors and registered player accounts.

## ADDED Requirements

### Requirement: Booking creation by player
The system SHALL allow booking an available slot. The player MUST provide name, phone, and optional email (if guest) or be authenticated as a registered Customer. The slot transitions to RESERVADO status within the same atomic database transaction.

#### Scenario: Successful guest booking
- **WHEN** a visitor submits valid slotId, nombreCliente, and telefonoCliente for a DISPONIBLE slot
- **THEN** the system creates the booking in PENDIENTE_PAGO state, marks the slot as RESERVADO, and returns payment instructions (active bank accounts for that complex)

#### Scenario: Booking unavailable slot
- **WHEN** a visitor attempts to book an already RESERVADO or BLOQUEADO slot
- **THEN** the system rejects the request with HTTP 409 Conflict

#### Scenario: Booking as authenticated customer
- **WHEN** an authenticated customer creates a booking
- **THEN** the system attaches the booking to `clienteId` and prepopulates customer profile information

### Requirement: Payment proof upload
The system SHALL allow players (guest or authenticated) to upload an image receipt for any booking in PENDIENTE_PAGO status. The booking state transitions to COMPROBANTE_SUBIDO.

#### Scenario: Valid receipt upload
- **WHEN** the player uploads an image (JPG, PNG, PDF ≤ 5MB) for a PENDIENTE_PAGO booking
- **THEN** the system stores the file in Supabase Storage, saves the URL in `comprobanteUrl`, and sets status to COMPROBANTE_SUBIDO

#### Scenario: Invalid file format
- **WHEN** the player attempts to upload an unsupported format
- **THEN** the system rejects the upload with HTTP 422 Unprocessable Entity

### Requirement: Admin reservation confirmation
The system SHALL allow ADMIN or STAFF users to transition a booking from COMPROBANTE_SUBIDO to CONFIRMADA upon verifying the bank transfer.

#### Scenario: Confirm booking
- **WHEN** the ADMIN updates a COMPROBANTE_SUBIDO booking to CONFIRMADA
- **THEN** the system marks the reservation as confirmed and logs the updated timestamp

#### Scenario: STAFF confirmation permission
- **WHEN** a STAFF user confirms a booking
- **THEN** the system processes the confirmation with the same privileges as an ADMIN

### Requirement: Booking cancellation and slot release
The system SHALL allow cancellation of reservations. Upon cancellation, the associated slot reverts to DISPONIBLE status within an atomic transaction.

#### Scenario: ADMIN cancels booking
- **WHEN** the ADMIN cancels a booking
- **THEN** the reservation status becomes CANCELADA and the associated slot reverts to DISPONIBLE

#### Scenario: Player cancels pending booking
- **WHEN** a player requests cancellation of their PENDIENTE_PAGO booking
- **THEN** the reservation transitions to CANCELADA and the slot reverts to DISPONIBLE

### Requirement: Payment instructions in reservation response
The system SHALL return the complex's active bank accounts in the reservation response so players immediately know where to transfer.

#### Scenario: Payment instructions included
- **WHEN** a reservation is created successfully
- **THEN** the response includes active bank accounts showing bank name, account number, account type, and account holder
