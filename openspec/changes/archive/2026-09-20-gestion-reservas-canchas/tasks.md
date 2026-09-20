## 1. Project Setup

- [x] 1.1 Create Next.js 14 project with TypeScript and App Router: `pnpm create next-app . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` and verify `pnpm dev` boots without issues
- [x] 1.2 Install core dependencies: `pnpm add prisma @prisma/client next-auth bcryptjs zod @supabase/supabase-js` and `pnpm add -D @types/bcryptjs`; verify `package.json` includes them
- [x] 1.3 Initialize Prisma with PostgreSQL: `pnpm dlx prisma init --datasource-provider postgresql`; verify `prisma/schema.prisma` and `.env` exist
- [x] 1.4 Configure `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env`; verify connection with `pnpm dlx prisma db pull`
- [x] 1.5 Initialize shadcn/ui: `pnpm dlx shadcn@latest init -d`; install base components `button`, `input`, `card`, `badge`, `table`, `dialog`, `select`, `form`, `sonner`; verify they appear in `src/components/ui/`
- [x] 1.6 Configure Supabase Storage client in `src/lib/supabase.ts` and set up `payment-receipts` bucket; verify connection succeeds

## 2. Database Schema (Prisma)

- [x] 2.1 Define enums in `prisma/schema.prisma`: `TipoCancha (PADEL, SINTETICA)`, `TipoCuenta (CORRIENTE, AHORROS)`, `EstadoSlot (DISPONIBLE, RESERVADO, BLOQUEADO)`, `EstadoReserva (PENDIENTE_PAGO, COMPROBANTE_SUBIDO, CONFIRMADA, CANCELADA)`, `RolComplejo (ADMIN, STAFF)`; verify with `npx prisma validate`
- [x] 2.2 Define `ComplejoDeportivo` and `CuentaBancaria` models with relationships; verify with `npx prisma validate`
- [x] 2.3 Define `Usuario` and `UsuarioComplejo` models with `@@unique([usuarioId, complejoId])`; verify with `npx prisma validate`
- [x] 2.4 Define `Cliente` and `Cancha` models related to `ComplejoDeportivo`; verify with `npx prisma validate`
- [x] 2.5 Define `HorarioDisponible` model linked to `Cancha`; verify with `npx prisma validate`
- [x] 2.6 Define `Slot` model with `@@unique([canchaId, fecha, horaInicio])` and relation `@relation(fields: [canchaId], references: [id])`; verify with `npx prisma validate`
- [x] 2.7 Define `Reserva` model with `slotId @unique` (strict 1:1 relation with Slot) and optional `clienteId`; verify with `npx prisma validate`
- [x] 2.8 Run `npx prisma migrate dev --name init` or `db push` to create tables in Supabase; verify tables exist
- [x] 2.9 Create `src/lib/prisma.ts` with PrismaClient singleton pattern (globalThis to prevent hot-reload duplicates); verify TypeScript imports clean

## 3. Authentication

- [x] 3.1 Create `src/lib/auth.ts` with `NextAuthOptions` for administrators using `CredentialsProvider` querying `Usuario` and verifying `bcryptjs.compare`; verify with test user
- [x] 3.2 Create `src/app/api/auth/[...nextauth]/route.ts` using options from `auth.ts`; verify `GET /api/auth/providers` returns proper provider
- [x] 3.3 Create `src/lib/auth-cliente.ts` with customer `NextAuthOptions` querying `Cliente`; verify independently
- [x] 3.4 Create `src/app/api/auth/cliente/[...nextauth]/route.ts`; verify it operates isolated from admin session
- [x] 3.5 Create `src/middleware.ts` protecting `/dashboard` and `/dashboard/**` with admin session, and `/mis-reservas` with customer session; verify unauthenticated redirection
- [x] 3.6 Create `/login` (admin), `/registro`, and `/login-cliente` (customer) pages with shadcn/ui forms; verify complete login/logout flows

## 4. Tenant Helper & Authorization

- [x] 4.1 Create `src/lib/tenant.ts` with `getCurrentUserAndTenant(targetComplejoId)` function extracting tenant and role from authenticated session
- [x] 4.2 Create `assertTenantAccess(complejoId, session)` throwing 403 if user lacks access to target complex
- [x] 4.3 Create `assertAdminOnly(rol)` to verify administrative privileges; verify STAFF is rejected from restricted actions

## 5. API — Complexes & Bank Accounts

- [x] 5.1 Implement `GET /api/admin/complejos` (SUPER_ADMIN): list all complexes with court/user counts
- [x] 5.2 Implement `POST /api/admin/complejos` (SUPER_ADMIN): create complex with Zod validation; return 409 on duplicate slug
- [x] 5.3 Implement `PATCH /api/admin/complejos/[id]` (SUPER_ADMIN): edit and deactivate complex; verify `activo: false` excludes complex from public view
- [x] 5.4 Implement `GET/POST/DELETE /api/dashboard/cuentas-bancarias` (ADMIN): bank account CRUD for authenticated complex; verify isolation

## 6. API — Courts & Schedules

- [x] 6.1 Implement `GET /api/dashboard/canchas` (ADMIN/STAFF): list complex courts; verify tenant filtering
- [x] 6.2 Implement `POST /api/dashboard/canchas` (ADMIN): create court with Zod validation; verify immediate public reflection
- [x] 6.3 Implement `PATCH /api/dashboard/canchas/[id]` (ADMIN): edit and toggle active court status; verify inactive courts are excluded
- [x] 6.4 Implement `GET/POST/DELETE /api/dashboard/horarios` (ADMIN): CRUD for `HorarioDisponible` per court; verify schedule persistence

## 7. API — Slots & Availability

- [x] 7.1 Create `src/lib/generate-slots.ts` with `generateSlotsForCancha(canchaId, startDate, endDate)`: reads `HorarioDisponible`, generates intervals matching `duracionSlotMin`, returns created slot count
- [x] 7.2 Implement `POST /api/dashboard/slots/generate` (ADMIN/STAFF): calls slot generator with `prisma.slot.createMany({ skipDuplicates: true })`; verify idempotency
- [x] 7.3 Implement `POST /api/dashboard/slots` (ADMIN/STAFF): create manual individual slot; verify `@@unique` conflict returns 409
- [x] 7.4 Implement `PATCH /api/dashboard/slots/[id]` (ADMIN/STAFF): toggle slot status; verify locking a RESERVADO slot returns 422
- [x] 7.5 Implement `GET /api/slots` (public, unauthenticated): return DISPONIBLE slots for a given court and date; verify no exposure of RESERVADO or BLOQUEADO slots

## 8. API — Booking Flow

- [x] 8.1 Implement `POST /api/reservas` (public): create booking + mark slot as RESERVADO within atomic Prisma transaction; return 409 on race conditions
- [x] 8.2 Implement `GET /api/reservas` (ADMIN/STAFF): list complex bookings with state and date filters; verify `complejoId` isolation
- [x] 8.3 Implement `GET /api/reservas/[id]` (ADMIN/STAFF or booking owner): return booking details with slot and court data
- [x] 8.4 Implement `POST /api/reservas/[id]/comprobante` (customer or guest): upload payment receipt, save `comprobanteUrl`, transition state to COMPROBANTE_SUBIDO
- [x] 8.5 Implement `PATCH /api/dashboard/reservas/[id]` (ADMIN/STAFF): accepts `{ estado: 'CONFIRMADA' | 'CANCELADA' }`; if CANCELADA, revert slot to DISPONIBLE within transaction
- [x] 8.6 Verify complete end-to-end booking flow: book slot → upload receipt → admin approval; verify slot stays RESERVADO and only reverts on cancellation

## 9. Public Tenant Views

- [x] 9.1 Create `src/app/_tenants/[slug]/page.tsx`: display complex info and active court list with type and hourly rates
- [x] 9.2 Create `src/app/_tenants/[slug]/reservar/[canchaId]/page.tsx`: date picker and available slot grid updating dynamically
- [x] 9.3 Create booking form with `nombreCliente`, `telefonoCliente`, `emailCliente`; submits to `POST /api/reservas` and renders bank transfer payment details
- [x] 9.4 Create `src/app/_tenants/[slug]/comprobante/[reservaId]/page.tsx`: file upload form; connects to receipt endpoint and updates state
- [x] 9.5 Create `src/app/mis-reservas/page.tsx` (authenticated customers): reservation history with status badges and payment links

## 10. Admin Dashboard

- [x] 10.1 Create layout `src/app/dashboard/layout.tsx` with sidebar navigation (Agenda, Bookings, Courts, Schedules, Slots, Settings) and header with complex branding and logout
- [x] 10.2 Create page `src/app/dashboard/page.tsx`: display today's reservations grouped by court with status badges
- [x] 10.3 Create page `src/app/dashboard/reservas/page.tsx`: booking table with filters by status, date, and search
- [x] 10.4 Create booking detail modal with payment proof image inspection and Confirm/Cancel action triggers
- [x] 10.5 Create court management page `src/app/dashboard/canchas/page.tsx`: list and creation/editing modal with activation toggle
- [x] 10.6 Create schedule configuration page `src/app/dashboard/horarios/page.tsx`: weekly grid configuring opening/closing times
- [x] 10.7 Create slot management page `src/app/dashboard/slots/page.tsx`: bulk generation trigger, manual slot creation, and lock/unlock toggle
- [x] 10.8 Create settings page `src/app/dashboard/configuracion/page.tsx` (ADMIN only): bank accounts management (list, add, toggle)

## 11. SuperAdmin Panel

- [x] 11.1 Create layout `src/app/admin/layout.tsx` with `esSuperAdmin = true` guard; redirect non-superadmins to `/dashboard`
- [x] 11.2 Create page `src/app/admin/complejos/page.tsx`: table of all registered complexes with activation/deactivation controls and subdomain links
- [x] 11.3 Create page `src/app/admin/usuarios/page.tsx`: list platform admins, form to create users and assign complex roles

## 12. Final Validation

- [x] 12.1 Run `pnpm exec prisma validate` to confirm schema integrity
- [x] 12.2 Run `pnpm run build` to verify TypeScript types and production Next.js build
- [x] 12.3 Verify anti-overbooking protection at transaction level
- [x] 12.4 Verify tenant isolation across complexes
- [x] 12.5 Verify complete guest flow: reserve → upload receipt → admin approval
