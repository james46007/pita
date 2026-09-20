# autenticacion-usuarios Specification

## Purpose

Manages identity and platform access for two primary actors: sports complex managers/staff (with access to the management dashboard) and players/customers (with access to their booking history). A SUPER_ADMIN possesses global access to the platform.

## Requirements

### Requirement: Administrator and staff authentication
The system SHALL authenticate users with roles SUPER_ADMIN, ADMIN, and STAFF via email and password. The session is isolated from customer sessions.

#### Scenario: Successful admin login
- **WHEN** a user provides valid email and password credentials
- **THEN** the system initiates a session and returns the user's data including their assigned roles and associated complexes

#### Scenario: Invalid credentials
- **WHEN** a user submits an incorrect email or password
- **THEN** the system returns HTTP 401 without disclosing whether the email exists

### Requirement: Complex-scoped roles and permissions
The system SHALL assign roles to users per complex via the `UsuarioComplejo` pivot table. A user may hold different roles across different complexes.

#### Scenario: ADMIN accesses their complex dashboard
- **WHEN** a user with the ADMIN role for complex X visits the dashboard
- **THEN** the system grants full access to courts, bookings, schedules, and configuration for that complex

#### Scenario: STAFF cannot access complex configuration
The system SHALL restrict users with the STAFF role from accessing complex settings (bank accounts and complex information).

- **WHEN** a STAFF user attempts to access the configuration section
- **THEN** the system returns HTTP 403 Forbidden

#### Scenario: SUPER_ADMIN accesses any section
- **WHEN** a user with the SUPER_ADMIN role accesses any tenant resource
- **THEN** the system grants unrestricted access across all complexes

### Requirement: Customer (player) registration and authentication
The system SHALL allow players to create an account with name, email, and password. The customer session is isolated from the admin session.

#### Scenario: Customer registration
- **WHEN** a visitor submits name, unique email, and a valid password
- **THEN** the system creates the customer record and returns an authenticated session

#### Scenario: Customer login
- **WHEN** a customer submits their valid credentials
- **THEN** the system returns an authenticated session with profile data

### Requirement: Booking without account (guest mode)
The system SHALL allow creating reservations without authentication, using only the customer's name and phone number.

#### Scenario: Booking as a guest
- **WHEN** an unauthenticated visitor creates a booking with name and phone number
- **THEN** the system creates the reservation with `clienteId = null` associated solely with the provided contact details
