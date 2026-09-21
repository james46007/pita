# Spec Delta: panel-superadmin

## ADDED Requirements

### Requirement: Global platform metrics aggregation
The system SHALL provide the SUPER_ADMIN with consolidated, cross-tenant metrics across all sports complexes from `/admin/metricas`.

#### Scenario: View global KPI summaries
- **WHEN** the SUPER_ADMIN views the `/admin/metricas` page
- **THEN** the system displays total platform Gross Merchandise Value (GMV), total confirmed bookings, active complex count, and platform average ticket for the selected date range.

#### Scenario: Filter platform metrics by date presets
- **WHEN** the SUPER_ADMIN selects a date preset (`today`, `last7days`, `thismonth`, `lastmonth`, or `custom`)
- **THEN** the system recalculates all platform aggregates and complex revenues within the specified time boundary.

### Requirement: Complex revenue ranking leaderboard
The system SHALL present a ranked leaderboard of all sports complexes ordered by their total confirmed revenue within the selected time window.

#### Scenario: Display complex revenue ranking table
- **WHEN** the SUPER_ADMIN navigates to `/admin/metricas`
- **THEN** the system renders a table listing each complex's rank, name, active court count, confirmed booking count, confirmed revenue, average ticket, and preliminary revenue tier badge (`BRONZE`, `SILVER`, or `GOLD`).

#### Scenario: Unauthorized access to global metrics
- **WHEN** an unauthenticated user or non-superadmin user requests `/api/admin/metricas/resumen` or `/admin/metricas`
- **THEN** the system denies access with an HTTP 401 or 403 response or redirects them to `/dashboard`.

### Requirement: Global consolidated CSV export
The system SHALL allow the SUPER_ADMIN to download an RFC 4180-compliant CSV report containing consolidated revenue data across all registered complexes.

#### Scenario: Successful global CSV export
- **WHEN** the SUPER_ADMIN clicks the "Export Consolidated CSV" button on `/admin/metricas`
- **THEN** the system streams a CSV file titled `superadmin-metrics-<preset>-<date>.csv` containing columns for complex name, slug, court count, confirmed bookings, confirmed revenue, average ticket, and revenue tier.
