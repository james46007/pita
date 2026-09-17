## Purpose

Global administration section for the SaaS platform, restricted strictly to SUPER_ADMIN users at `/admin`. Enables creating and managing sports complexes and assigning administrator/staff users.

## ADDED Requirements

### Requirement: Global complex management
The system SHALL allow the SUPER_ADMIN to list, create, update, and deactivate sports complexes from `/admin`.

#### Scenario: List all complexes
- **WHEN** the SUPER_ADMIN accesses `/admin/complejos`
- **THEN** the system displays all registered complexes with name, slug, contact information, metrics, and active status

#### Scenario: Deactivate complex
- **WHEN** the SUPER_ADMIN deactivates a complex
- **THEN** the system flags it as inactive and excludes its courts from public booking views

### Requirement: Admin and staff user management
The system SHALL allow the SUPER_ADMIN to create platform users and assign them ADMIN or STAFF roles across one or more complexes.

#### Scenario: Create admin user for complex
- **WHEN** the SUPER_ADMIN creates a user with email, name, and password, assigning the ADMIN role for complex X
- **THEN** the system creates the user, generates the `UsuarioComplejo` record, and enables immediate login

#### Scenario: Exclusive SUPER_ADMIN panel access
- **WHEN** a non-superadmin user attempts to access `/admin`
- **THEN** the system redirects them to `/dashboard` with HTTP 403 authorization handling
