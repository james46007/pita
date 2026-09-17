## Purpose

Enables registering and managing sports complexes as isolated tenants within the SaaS platform. Each complex maintains its own data, courts, staff, and bank accounts, isolated from other complexes.

## ADDED Requirements

### Requirement: Complex registration
The system SHALL allow the SUPER_ADMIN to create sports complexes with name, phone, address, unique slug, and active status.

#### Scenario: Create complex successfully
- **WHEN** the SUPER_ADMIN submits valid name, phone, address, and slug
- **THEN** the system creates the active complex and returns it with its generated ID

#### Scenario: Duplicate slug
- **WHEN** the SUPER_ADMIN attempts to create a complex with an already existing slug
- **THEN** the system rejects the operation with HTTP 409 Conflict indicating the slug is in use

### Requirement: Complex bank account management
The system SHALL allow the ADMIN to register one or more bank accounts per complex (bank name, account number, type CORRIENTE/AHORROS, account holder).

#### Scenario: Add bank account
- **WHEN** the ADMIN submits valid banking details for their complex
- **THEN** the system persists the account and returns it as active

#### Scenario: Multiple bank accounts
- **WHEN** the ADMIN configures multiple accounts (e.g. Bancolombia, Davivienda, etc.)
- **THEN** the system presents all active accounts to customers during the checkout flow

### Requirement: Tenant data isolation
The system SHALL ensure that no tenant user (ADMIN, STAFF, player) can read or mutate data belonging to a different complex.

#### Scenario: ADMIN accesses only own tenant data
- **WHEN** an authenticated ADMIN queries reservations or courts
- **THEN** the system filters and returns only records matching the user's `complejoId`

#### Scenario: Cross-tenant access attempt
- **WHEN** an ADMIN attempts to manipulate URLs or payload IDs to access another complex's resources
- **THEN** the system rejects the operation with HTTP 403 Forbidden
