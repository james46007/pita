# Design

## Context

The system currently stores all court bookings in the `Booking` model and operational time slots in the `Slot` model, linked to `Court` and `Complex`. All dashboard operations verify tenant membership through `getCurrentUserAndTenant(targetComplejoId)` and `assertTenantAccess(complejoId, session)`. See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**
- Provide real-time aggregation of confirmed and pending revenues, court occupancy percentage, and peak demand hours for complex managers.
- Provide date range presets ("Hoy", "Últimos 7 días", "Este Mes", "Mes Anterior", "Personalizado").
- Export filtered transactions directly to RFC 4180 compliant CSV for accounting.
- Native, responsive, accessible UI built with Tailwind CSS and shadcn/ui without requiring heavy third-party charting libraries.

**Non-Goals:**
- External BI or third-party analytical integrations (e.g. Mixpanel, Metabase).
- Predictive demand forecasting or dynamic pricing algorithms (can be explored in future changes).
- Cross-tenant comparative analytics (admins only ever see their own complex metrics; SuperAdmin platform-wide metrics remain separate).

## Decisions

### 1. Database Aggregation vs In-Memory
- **Decision**: Perform aggregations using Prisma queries (`prisma.booking.aggregate`, `prisma.booking.groupBy`, and `prisma.slot.count`) with SQL date boundaries.
- **Rationale**: Keeps memory consumption minimal on Next.js serverless runtimes and leverages database indexes on `(courtId, date)` and `(complexId)`.
- **Alternatives considered**: Fetching all historical bookings into memory and aggregating with JavaScript. Rejected due to poor scalability as booking volume grows.

### 2. Native Tailwind Visualizations vs Charting Library
- **Decision**: Build cleanly styled SVG and Tailwind bar indicators, progress bars, and breakdown tables instead of installing heavy charting packages.
- **Rationale**: Zero bundle bloat, fast load times, seamless dark/light mode integration with existing shadcn/ui theme, and full responsiveness.
- **Alternatives considered**: Installing Recharts or Chart.js. Rejected for now to prevent unnecessary client bundle size increase.

### 3. CSV Export Route Handler
- **Decision**: Implement `GET /api/dashboard/metricas/exportar` returning a downloadable CSV with `Content-Type: text/csv; charset=utf-8` and `Content-Disposition: attachment; filename="reporte-[slug]-[fecha].csv"`.
- **Rationale**: Native streaming download works consistently across desktop and mobile browsers without requiring client-side blob manipulation.

### 4. Tenant Scoping
- **Decision**: Both the summary API and the export API invoke `getCurrentUserAndTenant` and enforce `complejoId` in all Prisma where clauses.
- **Rationale**: Prevents data leakage between different sports complexes.

## Risks / Trade-offs

- **[Risk] High volume of historical slots slowing down occupancy calculation** → *Mitigation*: Restrict custom date ranges to a reasonable maximum (e.g., up to 1 year) and query only active courts.
- **[Risk] Timezone discrepancies in grouping by day** → *Mitigation*: Normalize dates to UTC or the complex's local calendar day when applying startOfDay and endOfDay filters.
