# Design: SuperAdmin Global Metrics and Revenue Leaderboard

## Context

The system has implemented tenant-scoped analytics in `/dashboard/metricas` using `src/lib/metrics.ts`. However, the SuperAdmin panel currently only provides CRUD lists for complexes (`/admin/complejos`) and users (`/admin/usuarios`). The platform owner lacks cross-tenant aggregation and leaderboard capabilities necessary to evaluate complex performance and configure business incentives.

## Goals / Non-Goals

**Goals:**
- Provide cross-tenant revenue aggregation and performance KPI calculation across all complexes.
- Build a SuperAdmin leaderboard ranking complexes by revenue with volume and tier indicators.
- Provide global CSV export of cross-tenant performance for offline financial analysis.
- Maintain consistent design aesthetics with the purple/dark theme used in `/admin/layout.tsx`.

**Non-Goals:**
- Modifying the database schema (tiers and rankings are calculated dynamically based on period GMV).
- Automated payment gateway splits or automated commission charging (reserved for future billing engine).
- Exposing cross-tenant metrics to non-superadmin users.

## Decisions

### 1. Cross-Tenant Query Strategy
- **Decision**: Query confirmed bookings directly through Prisma across all complexes matching the selected date range (`gte`, `lte`), selecting only required fields (`id`, `complexId`, `totalAmount`, `courtId`). Join with active `Complex` records.
- **Rationale**: Keeps querying fast and simple without requiring complex manual SQL or database migrations.
- **Alternatives considered**: Raw SQL aggregation (`SUM`, `COUNT` grouped by `complex_id`). Rejected for now because Prisma relations provide type safety and the booking volume is well within memory capacity.

### 2. Preliminary Tier Categorization
- **Decision**: Define revenue tiers dynamically based on monthly revenue thresholds:
  - `BRONZE`: Revenue < $2,000
  - `SILVER`: Revenue >= $2,000 and < $5,000
  - `GOLD`: Revenue >= $5,000
- **Rationale**: Immediately provides the platform owner with a visual hierarchy to determine benefits without locking the database into an early, unvalidated schema.

### 3. CSV Export Architecture
- **Decision**: Stream RFC 4180-compliant CSV via `GET /api/admin/metricas/exportar` re-using escaping conventions established in `src/lib/metrics.ts`.

## Risks / Trade-offs

- **[Performance on Large Multi-Tenant Volumes]** → Filter strictly on indexed fields (`status`, `date`) and avoid loading full slot or receipt BLOB payloads.
- **[Authorization Leaks]** → Verify `isSuperAdmin` at both the middleware layer and inside each route handler via `getServerSession(authOptionsAdmin)`.
