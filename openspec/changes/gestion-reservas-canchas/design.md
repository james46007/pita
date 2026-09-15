## Context

Proyecto nuevo sin código existente. Ver `proposal.md` para motivación. El stack elegido es Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui + Prisma ORM + PostgreSQL en Supabase. El sistema es multi-tenant SaaS con aislamiento row-level.

## Goals / Non-Goals

**Goals:**
- Definir la arquitectura de carpetas de Next.js App Router
- Diseñar el schema Prisma completo con todas las entidades y relaciones
- Establecer la estrategia de autenticación dual (admins vs. clientes)
- Garantizar anti-overbooking a nivel de base de datos
- Definir el patrón de aislamiento multi-tenant

**Non-Goals:**
- Integración de pagos online automáticos (Paymentez, PayPhone) — MVP usa comprobante manual
- Notificaciones por email/SMS — fuera del MVP
- Aplicación móvil nativa
- Reportes y analytics avanzados

## Decisions

### D1: Aislamiento multi-tenant — Row-level isolation

**Decisión**: Todos los tenants comparten la misma base de datos y esquema PostgreSQL. El aislamiento se logra filtrando siempre por `complejoId` en cada query.

**Rationale**: Para un MVP en Supabase es la opción más simple y económica. Schema-per-tenant requeriría múltiples conexiones Prisma o migraciones por tenant.

**Refuerzo adicional**: Row Level Security (RLS) de Supabase como segunda capa de seguridad.

**Alternativas descartadas**:
- Schema-per-tenant: más aislamiento pero incompatible con el cliente Prisma estándar sin trabajo adicional significativo.
- DB-per-tenant: costo y complejidad operativa inasumibles en MVP.

---

### D2: Anti-overbooking — Constraint único + relación 1:1 Slot↔Reserva

**Decisión**: La tabla `Slot` tiene un índice único `@@unique([canchaId, fecha, horaInicio])`. La tabla `Reserva` tiene un campo `slotId` con `@unique`, haciendo la relación 1:1. Cambiar el slot a RESERVADO y crear la Reserva ocurre en una sola transacción Prisma.

**Rationale**: Garantía a nivel de base de datos, no solo a nivel de aplicación. Incluso bajo carga concurrente, la base de datos rechaza la segunda inserción.

**Alternativas descartadas**:
- Check en aplicación (SELECT luego INSERT): propenso a race conditions bajo concurrencia.
- Pessimistic locking: más complejo y penaliza performance.

---

### D3: Autenticación dual — NextAuth con dos providers separados

**Decisión**: Una única instalación de NextAuth con dos rutas de sesión:
- `/api/auth/[...nextauth]` para administradores/staff (tabla `Usuario`)
- `/api/auth/cliente/[...nextauth]` para jugadores (tabla `Cliente`)

Cada una usa `CredentialsProvider` con su propia tabla.

**Rationale**: Mantiene las sesiones completamente separadas. Un cliente no puede acceder accidentalmente al dashboard aunque manipule cookies.

**Alternativas descartadas**:
- Una sola tabla de usuarios con campo `rol`: mayor riesgo de que un cliente obtenga acceso a rutas de admin por un bug de autorización.

---

### D4: Schema Prisma — 9 entidades

```
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
  diaSemana     Int      (0=Dom … 6=Sab)
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

### D5: Arquitectura de carpetas Next.js App Router

```
src/
  app/
    (public)/
      [slug]/
        page.tsx              -- landing pública del complejo
        reservar/
          [canchaId]/
            page.tsx          -- selección de slot + formulario reserva
        mis-reservas/
          page.tsx            -- historial cliente autenticado
      layout.tsx

    dashboard/
      layout.tsx              -- sidebar + auth guard (ADMIN/STAFF)
      page.tsx                -- agenda del día
      reservas/
        page.tsx
        [id]/page.tsx
      canchas/
        page.tsx
        [id]/page.tsx
      horarios/
        page.tsx
      slots/
        page.tsx
      configuracion/
        page.tsx              -- ADMIN only

    admin/
      layout.tsx              -- auth guard SUPER_ADMIN
      complejos/
        page.tsx
        [id]/page.tsx
      usuarios/
        page.tsx

    api/
      auth/[...nextauth]/route.ts
      auth/cliente/[...nextauth]/route.ts
      reservas/
        route.ts              -- GET (filtros), POST (crear)
        [id]/
          route.ts            -- GET, PATCH, DELETE
          comprobante/route.ts
      slots/
        route.ts              -- GET público (disponibilidad)
        generate/route.ts     -- POST admin (generar por rango)
      dashboard/
        reservas/route.ts     -- PATCH (confirmar/cancelar)
        slots/route.ts        -- POST, PATCH (admin)
      admin/
        complejos/route.ts
        usuarios/route.ts

  lib/
    prisma.ts                 -- singleton PrismaClient
    auth.ts                   -- NextAuth config (admins)
    auth-cliente.ts           -- NextAuth config (clientes)
    generate-slots.ts         -- lógica de generación de slots
    tenant.ts                 -- helper: extraer complejoId del tenant actual

  middleware.ts               -- protección de rutas por rol
  components/
    ui/                       -- shadcn/ui
    dashboard/
    public/
  types/
    index.ts
```

---

### D6: Subida de comprobantes — UploadThing

**Decisión**: Usar UploadThing para la subida de imágenes de comprobantes. Integra directamente con Next.js App Router, sin necesidad de configurar S3 manualmente.

**Alternativas descartadas**:
- Supabase Storage: viable, pero requiere más configuración de CORS y políticas.
- Cloudinary: overkill para MVS, costo adicional.

---

### D7: Generación de slots — función utilitaria server-side

La función `generateSlots(canchaId, fechaInicio, fechaFin)` en `lib/generate-slots.ts`:
1. Consulta los `HorarioDisponible` de la cancha
2. Para cada día en el rango que tenga horario, genera intervalos de `duracionSlotMin`
3. Usa `prisma.slot.createMany({ skipDuplicates: true })` para inserción idempotente

## Risks / Trade-offs

- **Row-level isolation sin RLS activo** → Si un endpoint olvida filtrar por `complejoId`, hay data leak. Mitigación: helper `withTenant(complejoId)` obligatorio en todos los servicios + RLS en Supabase como respaldo.
- **UploadThing como dependencia externa** → Si el servicio cae, los clientes no pueden subir comprobantes. Mitigación: para MVP es aceptable; a futuro se puede migrar a Supabase Storage.
- **Sesiones NextAuth duales** → Complejidad en middleware. Mitigación: el middleware distingue rutas `/dashboard` y `/admin` (sesión admin) de `/mis-reservas` (sesión cliente) claramente.
- **Generación masiva de slots** → Para un rango de 30 días con 16 horas/día podría generar ~480 slots por cancha. Mitigación: `createMany` con `skipDuplicates` es eficiente; limitar el rango máximo a 60 días por request.

## Open Questions

- ¿Se requiere confirmación por email al cliente al crear la reserva? (Implicaría añadir Resend o similar — excluido del MVP pero fácil de añadir después)
- ¿El precio total se calcula siempre como `precioHora * (duracionSlotMin / 60)` o habrá precios especiales por franja horaria?
