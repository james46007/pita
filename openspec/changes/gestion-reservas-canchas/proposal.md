## Why

El mercado ecuatoriano carece de un sistema centralizado y asequible para que complejos deportivos (canchas sintéticas y de pádel) gestionen sus reservas en línea. Hoy la coordinación ocurre por WhatsApp y llamadas telefónicas, lo que genera overbooking, pérdida de clientes y trabajo manual para los administradores. Se construye este SaaS multi-tenant para resolver ese problema y monetizarlo como plataforma.

## What Changes

- Nuevo sistema SaaS multi-tenant de gestión de reservas para complejos deportivos.
- Los jugadores pueden reservar turnos en línea como invitados o con cuenta registrada.
- Flujo de confirmación manual con comprobante de pago (transferencia bancaria), adaptado al mercado ecuatoriano.
- Panel de administración (`/dashboard`) para que ADMIN y STAFF gestionen canchas, horarios, slots y reservas.
- Panel de super-administración (`/admin`) para gestionar complejos y usuarios a nivel plataforma.
- Generación automática de slots a partir de horarios semanales definidos por el admin, con opción de crear/bloquear slots manualmente.
- Anti-overbooking garantizado mediante constraint único `(canchaId, fecha, horaInicio)` en la base de datos.
- Soporte de múltiples cuentas bancarias por complejo para instrucciones de pago al cliente.

## Capabilities

### New Capabilities

- `multitenant-complejos`: Gestión de complejos deportivos como tenants aislados (nombre, teléfono, dirección, slug). Incluye cuentas bancarias por complejo.
- `canchas-y-horarios`: CRUD de canchas (tipo PADEL/SINTETICA, precio/hora, duración de slot) y definición de horarios semanales de disponibilidad.
- `slots-y-disponibilidad`: Generación automática y gestión manual de slots de reserva. Estados DISPONIBLE / RESERVADO / BLOQUEADO.
- `flujo-reservas`: Ciclo completo de reserva: selección de slot → datos del cliente → instrucciones de pago → subida de comprobante → confirmación o cancelación por el admin. Estados: PENDIENTE_PAGO / COMPROBANTE_SUBIDO / CONFIRMADA / CANCELADA.
- `autenticacion-usuarios`: Autenticación NextAuth para administradores (SUPER_ADMIN) y staff de complejos (ADMIN / STAFF via tabla pivot UsuarioComplejo). Los jugadores tienen autenticación separada (Cliente) con soporte de reserva como invitado.
- `dashboard-admin`: Panel privado `/dashboard` para ADMIN/STAFF: vista de agenda del día, gestión de reservas, canchas, horarios, slots manuales y configuración del complejo.
- `panel-superadmin`: Sección `/admin` exclusiva para SUPER_ADMIN: gestión de complejos y usuarios de la plataforma.

### Modified Capabilities

*(Proyecto nuevo — sin capabilities preexistentes)*

## Impact

- **Stack**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui, Prisma ORM, PostgreSQL (Supabase).
- **Base de datos**: Nuevo schema Prisma con 9 entidades: `ComplejoDeportivo`, `CuentaBancaria`, `Cancha`, `HorarioDisponible`, `Slot`, `Reserva`, `Cliente`, `Usuario`, `UsuarioComplejo`.
- **Autenticación**: NextAuth.js con dos sesiones independientes (admins vs. clientes).
- **APIs**: Endpoints REST bajo `/api/` para reservas, slots, comprobantes y operaciones de dashboard.
- **Aislamiento de datos**: Row-level isolation por `complejoId` + Row Level Security de Supabase.
- **Dependencias nuevas**: `next`, `prisma`, `@prisma/client`, `next-auth`, `@uploadthing/react` (comprobantes), `shadcn/ui`, `tailwindcss`, `zod`.
