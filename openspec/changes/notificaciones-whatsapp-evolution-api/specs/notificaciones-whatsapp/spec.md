# Spec Delta

## Purpose

Enables sports complex administrators to link their WhatsApp account via Evolution API to automate reliable delivery of booking confirmations and notifications to players.

## ADDED Requirements

### Requirement: WhatsApp Account Linking via QR Code
The system SHALL allow sports complex administrators to initiate a WhatsApp session by generating a dynamic QR code via Evolution API, monitoring connection status in real time.

#### Scenario: Successful QR code generation
- **WHEN** a user with ADMIN role requests to link WhatsApp from the settings interface
- **THEN** the system creates or reconnects the complex instance in Evolution API and returns a base64 QR code with an expiration window

#### Scenario: Status update upon scan
- **WHEN** the administrator successfully scans the QR code using the WhatsApp mobile application
- **THEN** the instance state transitions to "CONNECTED", persisting the paired phone number and profile name in the database

#### Scenario: Restricted access for STAFF role
- **WHEN** a user with STAFF role accesses the WhatsApp management view
- **THEN** the system displays current connection status in read-only mode and disables linking and unlinking actions

### Requirement: WhatsApp Session Disconnection
The system SHALL allow administrators to log out and unlink an active WhatsApp instance at any time.

#### Scenario: Voluntary session disconnect
- **WHEN** an ADMIN user confirms disconnecting their account
- **THEN** the system requests a logout from Evolution API and updates the local status to "DISCONNECTED", retaining previous delivery logs

### Requirement: Connection Lifecycle Webhook Processing
The system SHALL process connection lifecycle events received from Evolution API to synchronize state without relying solely on polling.

#### Scenario: Remote disconnection notification
- **WHEN** Evolution API dispatches a webhook indicating session was closed from the mobile phone
- **THEN** the system immediately updates the local configuration status to "DISCONNECTED"

### Requirement: Phone Number Normalization and Validation
The system SHALL normalize customer phone numbers to the E.164 international standard prior to any outbound transmission attempt.

#### Scenario: Domestic Ecuador number with leading zero
- **WHEN** the customer phone number is entered as "0991234567"
- **THEN** the system transforms it to "593991234567" before enqueueing

#### Scenario: Number with explicit international country code
- **WHEN** the customer phone number includes a country code prefix such as "+573001234567"
- **THEN** the system removes non-digit characters and preserves the international prefix as "573001234567"

#### Scenario: Invalid phone number
- **WHEN** the customer phone number contains an insufficient number of digits
- **THEN** the system marks the outbound message as "FAILED_PERMANENT" with reason "invalid_phone" without consuming delivery retries

### Requirement: Idempotent Enqueueing upon Booking Confirmation
The system SHALL insert an outbound notification in the queue whenever a booking transitions to CONFIRMED, guaranteeing that duplicate messages are never dispatched for the same reservation.

#### Scenario: Successful payment confirmation
- **WHEN** an admin or staff member validates payment and updates the booking to CONFIRMED
- **THEN** the system creates an entry in WhatsappOutboundMessage with "PENDING" status, scheduled with a human-like random delay between 3 and 8 seconds

#### Scenario: Duplicate confirmation attempt
- **WHEN** confirmation is invoked on a booking that already has an outbound record in queue or delivered
- **THEN** the system does not produce a second outbound record due to unique reservation constraints

### Requirement: Asynchronous Queue Processing and Retries
The system SHALL dispatch pending messages respecting infrastructure execution time constraints and applying exponential backoff upon transient errors.

#### Scenario: Successful message delivery
- **WHEN** the cron worker inspects a pending message whose retry timestamp has arrived and the instance is connected
- **THEN** the system delivers the message via Evolution API, logs delivery timestamp, and transitions status to "SENT"

#### Scenario: Transient upstream service failure
- **WHEN** Evolution API is unreachable or returns a temporary error
- **THEN** the system increments the attempt count and reschedules the next delivery attempt with exponential backoff (2 min, 8 min, 30 min)

#### Scenario: Max retry threshold exceeded
- **WHEN** an outbound message reaches 3 consecutive failed delivery attempts
- **THEN** the record transitions to "FAILED_PERMANENT" and flags an alert so the administrator can contact the player manually

#### Scenario: Disconnected instance or suspended subscription
- **WHEN** an outbound record is evaluated but the complex WhatsApp instance is disconnected or subscription is suspended
- **THEN** the system pauses the record for 1 hour without incrementing attempt count, allowing eventual delivery once resolved
