# Tasks: SuperAdmin Global Metrics and Revenue Leaderboard

## 1. Backend & Cross-Tenant Analytics Layer

- [x] 1.1 Create `src/lib/admin-metrics.ts` providing cross-tenant aggregation, GMV calculation, and revenue tier classification (`BRONZE`, `SILVER`, `GOLD`). Verify calculation accuracy with sample data.
- [x] 1.2 Implement `src/app/api/admin/metricas/resumen/route.ts` supporting `preset` and custom date filters with strict `isSuperAdmin` session check. Verify response payload returns global KPIs and complex ranking array.
- [x] 1.3 Implement `src/app/api/admin/metricas/exportar/route.ts` streaming an RFC 4180-compliant CSV of cross-tenant performance. Verify headers and format.

## 2. Frontend & SuperAdmin Interface

- [x] 2.1 Update `src/app/admin/layout.tsx` to add "Global Metrics" link (`/admin/metricas`) with `BarChart3` icon. Verify sidebar link appears and navigates correctly.
- [x] 2.2 Build `src/app/admin/metricas/page.tsx` displaying global KPI cards (GMV, total bookings, platform average ticket, active complexes) and date preset filters. Verify responsive layout and loading state.
- [x] 2.3 Implement the complex ranking leaderboard table with rank, complex name, court count, confirmed bookings, revenue, average ticket, and revenue tier badge, plus CSV download button. Verify data renders accurately.

## 3. Verification & System Validation

- [x] 3.1 Run `npm run build` or `pnpm exec tsc --noEmit` to verify type safety and build integrity with zero warnings or errors.
- [x] 3.2 Verify authorization enforcement by confirming non-superadmin requests receive 403 / redirect, while SUPER_ADMIN sessions successfully view global metrics.
