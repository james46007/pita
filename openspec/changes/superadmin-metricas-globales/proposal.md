# Proposal: SuperAdmin Global Metrics and Revenue Leaderboard

## Why

Currently, the platform allows individual complex owners to monitor their own revenue and court metrics, but the platform owner (SUPER_ADMIN) has no consolidated view of cross-tenant performance. To assess business health, evaluate multi-tenant activity, and offer incentives or tiered benefits (e.g., lower commissions, priority listing) based on revenue volume, the SUPER_ADMIN needs a centralized financial dashboard and a ranking leaderboard across all complexes.

## What Changes

- Add a centralized SuperAdmin metrics overview endpoint (`/api/admin/metricas/resumen`) that computes platform-wide GMV, total bookings, active complex count, and cross-tenant average ticket across flexible date presets (`today`, `last7days`, `thismonth`, `lastmonth`, `custom`).
- Add a complex ranking leaderboard in the SuperAdmin analytics dashboard, displaying each complex's court count, confirmed booking count, confirmed revenue, average ticket, and a preliminary revenue tier indicator (`BRONZE`, `SILVER`, `GOLD`).
- Add a global CSV export endpoint (`/api/admin/metricas/exportar`) for downloading consolidated cross-tenant financial reports.
- Add `/admin/metricas` page accessible only to `isSuperAdmin` users with responsive KPI cards, ranking table, date filter controls, and CSV export action.
- Update SuperAdmin sidebar navigation in `src/app/admin/layout.tsx` to include "Global Metrics".

## Capabilities

### Modified Capabilities
- `panel-superadmin`: Adds global platform revenue metrics aggregation, cross-tenant complex ranking leaderboard, and consolidated financial export capabilities to `/admin`.

## Impact
- **APIs**: New endpoints `/api/admin/metricas/resumen` and `/api/admin/metricas/exportar` with SuperAdmin session authorization.
- **UI**: New page `/admin/metricas` and navigation link in `src/app/admin/layout.tsx`.
- **Database**: Read-only aggregation queries over `Complex`, `Booking`, and `Court` models; no breaking schema migrations required.
