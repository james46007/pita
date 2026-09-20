# Spec Delta

## ADDED Requirements

### Requirement: Metrics dashboard navigation and overview
The system SHALL provide a dedicated navigation link to `/dashboard/metricas` in the admin dashboard sidebar, and display high-level KPI cards (revenue, occupancy, active bookings) for the current month on the dashboard.

#### Scenario: Admin views metrics link in sidebar
- **WHEN** an ADMIN or STAFF user views the dashboard navigation sidebar
- **THEN** the system displays a navigation item for "Métricas y Reportes" pointing to `/dashboard/metricas`

#### Scenario: Quick KPI summary on main dashboard
- **WHEN** an ADMIN accesses the main dashboard
- **THEN** the system displays total monthly confirmed revenue and overall court occupancy rate
