# Proposal

## Why

Sports complex administrators currently lack business visibility into their operations; they cannot easily track revenue trends, identify underutilized courts, or know peak booking hours without manually analyzing database records or spreadsheets. Adding a dedicated financial and operational metrics module empowers complex managers to make data-driven decisions, optimize pricing and court availability, and export revenue reports for accounting.

## What Changes

- New analytics and financial reporting dashboard at `/dashboard/metricas`.
- Summary KPI metric cards: Total Revenue (confirmed bookings), Occupancy Rate (percentage of available slots booked), Total Bookings, and Average Revenue per Booking.
- Time range filtering: Today, Last 7 Days, This Month, Last Month, and custom date range picker.
- Court performance breakdown: revenue and occupancy comparison across padel and turf courts.
- Peak hours and popularity heatmap/chart: booking distribution across operating hours and days of the week.
- CSV export endpoint and button: download filtered booking transaction history for accounting and reconciliation.
- Integration into the `/dashboard` sidebar navigation for ADMIN and STAFF users.

## Capabilities

### New Capabilities
- `metricas-y-reportes`: Aggregates and displays financial KPIs (confirmed revenue, projected revenue, average ticket), court occupancy rates, peak hours analysis, and allows exporting transaction data as CSV.

### Modified Capabilities
- `dashboard-admin`: Adds analytics navigation entry to the sidebar and high-level KPI indicators to the admin dashboard overview.

## Impact

- **New Route**: `/dashboard/metricas` for the metrics overview and visual charts.
- **New API Endpoints**:
  - `GET /api/dashboard/metricas/resumen` (KPIs, revenue, and occupancy data grouped by date/court).
  - `GET /api/dashboard/metricas/exportar` (CSV download with filtered booking details).
- **Dependencies**: No external charting dependency required (or lightweight SVG / Tailwind-based bar charts and indicators matching existing shadcn/ui design).
- **Permissions**: Scoped strictly by `complejoId` via `tenant.ts` ensuring complete multi-tenant data isolation.
