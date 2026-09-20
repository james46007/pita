# Tasks

## 1. Backend & API Endpoints

- [x] 1.1 Implement aggregation helper in `src/lib/metrics.ts` to compute total confirmed revenue, pending revenue, average ticket, court occupancy, and hourly peak distribution scoped by `complejoId` and date range; verify calculations handle zero-booking edge cases.
- [x] 1.2 Implement `GET /api/dashboard/metricas/resumen` endpoint supporting query parameters `from`, `to`, and `preset`; verify it returns aggregated KPIs and rejects unauthenticated or unauthorized tenant access with HTTP 401/403.
- [x] 1.3 Implement `GET /api/dashboard/metricas/exportar` endpoint generating and streaming RFC 4180 CSV with headers (ID, Fecha, Cancha, Cliente, Teléfono, Monto, Estado, Creado); verify downloading via browser produces a valid CSV file.

## 2. Dashboard UI & Analytics Views

- [x] 2.1 Update `src/app/dashboard/layout.tsx` to add "Métricas y Reportes" item with an analytics icon in the sidebar navigation; verify the link navigates to `/dashboard/metricas`.
- [x] 2.2 Create `src/app/dashboard/metricas/page.tsx` with date filter presets ("Hoy", "Últimos 7 días", "Este Mes", "Mes Anterior", "Personalizado"); verify state updates and triggers data reload on filter change.
- [x] 2.3 Build KPI summary cards (Ingresos Confirmados, Ingresos Proyectados, Tasa de Ocupación, Ticket Promedio) in the metrics page; verify responsive grid layout in light and dark mode.
- [x] 2.4 Build visual court performance breakdown and hourly peak distribution charts using Tailwind bar indicators; verify numbers match API aggregates.
- [x] 2.5 Add "Exportar a CSV" button triggering direct file download with the active date filters; verify downloaded file matches active filters.

## 3. Integration & Validation

- [x] 3.1 Add quick KPI overview widgets to the main dashboard page (`src/app/dashboard/page.tsx`); verify current month summary appears alongside today's agenda.
- [x] 3.2 Verify multi-tenant isolation ensuring complex administrators can never see metrics from another complex.
- [x] 3.3 Run `pnpm run build` to verify TypeScript types and production build integrity.
