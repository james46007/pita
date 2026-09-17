## Why

The Ecuadorian market lacks a centralized, accessible system for sports complexes (synthetic soccer fields and padel courts) to manage reservations online. Today, booking coordination happens manually through WhatsApp and phone calls, resulting in overbooking, lost customers, and heavy operational workload for administrators. This multi-tenant SaaS is built to solve this problem and monetize as a platform.

## What Changes

- New multi-tenant SaaS booking management system for sports complexes.
- Players can book slots online as guests or with a registered account.
- Manual payment proof verification flow (bank transfer), adapted to the local market payment habits.
- Admin dashboard (`/dashboard`) for ADMIN and STAFF to manage courts, schedules, slots, and bookings.
- Super-admin panel (`/admin`) to manage complexes and platform-wide users.
- Automated slot generation from weekly operational schedules defined by the admin, with manual slot creation/blocking capabilities.
- Anti-overbooking guaranteed via database unique constraint `(canchaId, fecha, horaInicio)`.
- Support for multiple bank accounts per complex for customer payment instructions.

## Capabilities

### New Capabilities

- `multitenant-complejos`: Multi-tenant complex management as isolated tenants (name, phone, address, slug), including bank accounts per complex.
- `canchas-y-horarios`: Court CRUD (type PADEL/SINTETICA, hourly rate, slot duration) and weekly operational schedule configuration.
- `slots-y-disponibilidad`: Automated generation and manual slot management. States: DISPONIBLE / RESERVADO / BLOQUEADO.
- `flujo-reservas`: End-to-end booking cycle: slot selection → customer details → payment instructions → receipt upload → admin approval or rejection. States: PENDIENTE_PAGO / COMPROBANTE_SUBIDO / CONFIRMADA / CANCELADA.
- `autenticacion-usuarios`: Dual NextAuth authentication for administrators (SUPER_ADMIN) and complex staff (ADMIN / STAFF via UsuarioComplejo pivot). Separate player authentication (Cliente) with guest booking support.
- `dashboard-admin`: Private `/dashboard` panel for ADMIN/STAFF: daily schedule overview, bookings management, courts, schedules, manual slots, and complex configuration.
- `panel-superadmin`: Dedicated `/admin` section for SUPER_ADMIN: platform-wide complex and user management.

### Modified Capabilities

*(New project — no pre-existing capabilities)*

## Impact

- **Stack**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL (Supabase).
- **Database**: New Prisma schema with 9 models: `ComplejoDeportivo`, `CuentaBancaria`, `Cancha`, `HorarioDisponible`, `Slot`, `Reserva`, `Cliente`, `Usuario`, `UsuarioComplejo`.
- **Authentication**: NextAuth.js with two isolated sessions (admins vs. players).
- **APIs**: REST endpoints under `/api/` for bookings, slots, receipts, and dashboard operations.
- **Data Isolation**: Row-level isolation by `complejoId` + Supabase Row Level Security.
- **Dependencies**: `next`, `prisma`, `@prisma/client`, `next-auth`, `@supabase/supabase-js`, `shadcn/ui`, `tailwindcss`, `zod`.
