## Context

New project without legacy code. See `proposal.md` for background and rationale. The chosen stack is Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui + Prisma ORM + PostgreSQL on Supabase. The system is a multi-tenant SaaS with row-level data isolation.

## Goals / Non-Goals

**Goals:**
- Define Next.js App Router folder architecture
- Design comprehensive Prisma schema with all models and relationships
- Establish dual authentication strategy (admins vs. customers)
- Guarantee anti-overbooking at database level
- Define multi-tenant isolation pattern

**Non-Goals:**
- Direct automated payment gateways (Paymentez, Stripe, etc.) — MVP uses manual transfer receipt confirmation
- Email/SMS notifications — outside MVP scope
- Native mobile application
- Advanced reporting and analytics

## Decisions

### D1: Multi-tenant Isolation — Subdomains + Row-level Isolation

**Decision**: 
- Routing via subdomains (`[slug].domain.com` or `[slug].localhost:3000`).
- `middleware.ts` intercepts the host header, extracts the complex subdomain/slug, and internally rewrites the request to `/_tenants/[slug]/...` while keeping the browser URL clean.
- All tenants share the same PostgreSQL database on Supabase with strict filtering by `complejoId` on every query.

**Rationale**: Delivers a professional, white-label SaaS experience for each sports complex.

---

### D2: Anti-overbooking — Unique Constraint + 1:1 Slot↔Booking Relationship

**Decision**: The `Slot` model enforces a unique compound index `@@unique([canchaId, fecha, horaInicio])`. The `Reserva` model holds a `@unique` foreign key on `slotId`, establishing a strict 1:1 relation. Updating slot to `RESERVADO` and creating `Reserva` occurs within an atomic Prisma transaction.

**Rationale**: Enforced at database level rather than just application memory. Even under concurrent requests, PostgreSQL rejects duplicate inserts.

---

### D3: Dual Authentication — NextAuth with Two Distinct Providers

**Decision**: A single NextAuth configuration structure running two separate session endpoints:
- `/api/auth/[...nextauth]` for administrators and staff (`Usuario` table)
- `/api/auth/cliente/[...nextauth]` for players (`Cliente` table)

Each session uses independent cookies (`auth-admin.session-token` and `auth-cliente.session-token`).

---

### D4: Prisma Schema — 9 Models

```prisma
ComplejoDeportivo
  id            String   @id @default(cuid())
  nombre        String
  telefono      String
  direccion     String
  slug          String   @unique
  logoUrl       String?
  activo        Boolean  @default(true)
  createdAt     DateTime @default(now())
  canchas       Cancha[]
  cuentas       CuentaBancaria[]
  usuarios      UsuarioComplejo[]

CuentaBancaria
  id            String   @id @default(cuid())
  complejoId    String
  banco         String
  numeroCuenta  String
  tipoCuenta    TipoCuenta  (CORRIENTE / AHORROS)
  titular       String
  activo        Boolean  @default(true)
  complejo      ComplejoDeportivo @relation(...)

Cancha
  id              String   @id @default(cuid())
  complejoId      String
  nombre          String
  tipo            TipoCancha  (PADEL / SINTETICA)
  precioHora      Decimal
  duracionSlotMin Int      @default(60)
  activo          Boolean  @default(true)
  complejo        ComplejoDeportivo @relation(...)
  horarios        HorarioDisponible[]
  slots           Slot[]

HorarioDisponible
  id            String   @id @default(cuid())
  canchaId      String
  diaSemana     Int      (0=Sun … 6=Sat)
  horaApertura  String   ("06:00")
  horaCierre    String   ("22:00")
  activo        Boolean  @default(true)
  cancha        Cancha @relation(...)

Slot
  id            String   @id @default(cuid())
  canchaId      String
  fecha         DateTime @db.Date
  horaInicio    String   ("08:00")
  horaFin       String   ("09:00")
  estado        EstadoSlot  (DISPONIBLE / RESERVADO / BLOQUEADO)
  cancha        Cancha @relation(...)
  reserva       Reserva?
  @@unique([canchaId, fecha, horaInicio])   <-- ANTI-OVERBOOKING

Reserva
  id               String   @id @default(cuid())
  slotId           String   @unique
  canchaId         String
  complejoId       String
  clienteId        String?
  nombreCliente    String
  telefonoCliente  String
  emailCliente     String?
  estado           EstadoReserva
                   (PENDIENTE_PAGO / COMPROBANTE_SUBIDO /
                    CONFIRMADA / CANCELADA)
  comprobanteUrl   String?
  montoTotal       Decimal
  notas            String?
  creadaAt         DateTime @default(now())
  actualizadaAt    DateTime @updatedAt
  slot             Slot @relation(...)
  cliente          Cliente? @relation(...)

Cliente
  id               String   @id @default(cuid())
  nombre           String
  email            String   @unique
  telefono         String?
  passwordHash     String
  emailVerificado  Boolean  @default(false)
  createdAt        DateTime @default(now())
  reservas         Reserva[]

Usuario
  id            String   @id @default(cuid())
  nombre        String
  email         String   @unique
  passwordHash  String
  esSuperAdmin  Boolean  @default(false)
  createdAt     DateTime @default(now())
  complejos     UsuarioComplejo[]

UsuarioComplejo
  id          String   @id @default(cuid())
  usuarioId   String
  complejoId  String
  rol         RolComplejo  (ADMIN / STAFF)
  usuario     Usuario @relation(...)
  complejo    ComplejoDeportivo @relation(...)
  @@unique([usuarioId, complejoId])
```

---

### D5: Next.js App Router Folder Architecture (Subdomain Rewrites)

```
src/
  app/
    _tenants/
      [slug]/                 -- Public tenant views via subdomain
        page.tsx              -- Complex landing page
        reservar/
          [canchaId]/
            page.tsx          -- Slot selection and reservation
            comprobante/
              [reservaId]/
                page.tsx      -- Payment receipt upload
        mis-reservas/
          page.tsx            -- Player reservation history

    dashboard/
      layout.tsx              -- Sidebar + RBAC auth guard (ADMIN/STAFF)
      page.tsx                -- Day schedule overview
      reservas/
        page.tsx
        [id]/page.tsx
      canchas/
        page.tsx
      horarios/
        page.tsx
      slots/
        page.tsx
      configuracion/
        page.tsx              -- ADMIN only

    admin/
      layout.tsx              -- SUPER_ADMIN auth guard
      complejos/
        page.tsx
      usuarios/
        page.tsx

    api/
      auth/[...nextauth]/route.ts
      auth/cliente/[...nextauth]/route.ts
      reservas/
        route.ts
        [id]/
          route.ts
          comprobante/route.ts
      slots/
        route.ts
        generate/route.ts
      dashboard/
        reservas/route.ts
        slots/route.ts

  lib/
    prisma.ts                 -- PrismaClient singleton
    supabase.ts               -- Supabase client (Storage for payment-receipts)
    auth.ts                   -- NextAuth config (admins/staff)
    auth-cliente.ts           -- NextAuth config (players)
    generate-slots.ts         -- Slot generation utility
    tenant.ts                 -- Tenant isolation & authorization helpers

  middleware.ts               -- Subdomain rewrites & RBAC protection
  components/
    ui/                       -- shadcn/ui components
```

---

### D6: Receipt Storage — Supabase Storage

**Decision**: Use a dedicated Supabase Storage bucket (`payment-receipts`). The client uploads the receipt image and the public/signed URL is stored in `Reserva.comprobanteUrl`.

**Rationale**: Keeps all backend assets centralized inside Supabase (PostgreSQL + Storage) without third-party dependencies.

---

### D7: Package Manager — pnpm

**Decision**: Dependency management and command execution use `pnpm` and `pnpm dlx`.

---

### D8: Slot Generation — Server-side Utility Function

The `generateSlotsForCancha(canchaId, fechaInicio, fechaFin)` helper in `lib/generate-slots.ts`:
1. Reads `HorarioDisponible` for the given court
2. Generates time intervals respecting `duracionSlotMin` for applicable days
3. Uses `prisma.slot.createMany({ skipDuplicates: true })` for idempotent execution
