## 1. Inicialización del Proyecto

- [ ] 1.1 Crear proyecto Next.js 14 con TypeScript y App Router: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"` y verificar que `npm run dev` levanta sin errores
- [ ] 1.2 Instalar dependencias base: `npm install prisma @prisma/client next-auth bcryptjs zod` y `npm install -D @types/bcryptjs`; verificar que `package.json` las incluye
- [ ] 1.3 Inicializar Prisma con PostgreSQL: `npx prisma init --datasource-provider postgresql`; verificar que `prisma/schema.prisma` y `.env` existen
- [ ] 1.4 Configurar variable `DATABASE_URL` en `.env` apuntando a la instancia de Supabase; verificar conexión con `npx prisma db pull` (sin tablas aún, pero sin error de conexión)
- [ ] 1.5 Inicializar shadcn/ui: `npx shadcn@latest init`; instalar componentes base `button`, `input`, `card`, `badge`, `table`, `dialog`, `select`, `form`, `toast`; verificar que aparecen en `components/ui/`
- [ ] 1.6 Configurar UploadThing: instalar `uploadthing @uploadthing/next`; crear `src/app/api/uploadthing/core.ts` y `route.ts`; verificar que el endpoint responde en desarrollo

## 2. Schema de Base de Datos (Prisma)

- [ ] 2.1 Escribir los enums en `prisma/schema.prisma`: `TipoCancha (PADEL, SINTETICA)`, `TipoCuenta (CORRIENTE, AHORROS)`, `EstadoSlot (DISPONIBLE, RESERVADO, BLOQUEADO)`, `EstadoReserva (PENDIENTE_PAGO, COMPROBANTE_SUBIDO, CONFIRMADA, CANCELADA)`, `RolComplejo (ADMIN, STAFF)`; verificar con `npx prisma validate`
- [ ] 2.2 Definir modelos `ComplejoDeportivo` y `CuentaBancaria` con la relación entre ellos; verificar con `npx prisma validate`
- [ ] 2.3 Definir modelos `Usuario` y `UsuarioComplejo` con `@@unique([usuarioId, complejoId])`; verificar con `npx prisma validate`
- [ ] 2.4 Definir modelos `Cliente` y `Cancha` con su relación a `ComplejoDeportivo`; verificar con `npx prisma validate`
- [ ] 2.5 Definir modelo `HorarioDisponible` relacionado a `Cancha`; verificar con `npx prisma validate`
- [ ] 2.6 Definir modelo `Slot` con `@@unique([canchaId, fecha, horaInicio])` y relación `@relation(fields: [canchaId], references: [id])`; verificar con `npx prisma validate`
- [ ] 2.7 Definir modelo `Reserva` con `slotId @unique` (relación 1:1 con Slot) y `clienteId` opcional; verificar con `npx prisma validate`
- [ ] 2.8 Ejecutar `npx prisma migrate dev --name init` para crear las tablas en Supabase; verificar que la migración aplica sin errores y las tablas existen en Supabase Studio
- [ ] 2.9 Crear `src/lib/prisma.ts` con el singleton de PrismaClient (patrón global para evitar hot-reload en desarrollo); verificar que puede importarse sin error de TypeScript

## 3. Autenticación

- [ ] 3.1 Crear `src/lib/auth.ts` con `NextAuthOptions` para administradores usando `CredentialsProvider` que consulta la tabla `Usuario` y verifica `bcryptjs.compare`; verificar con un usuario de prueba creado directamente en DB
- [ ] 3.2 Crear `src/app/api/auth/[...nextauth]/route.ts` que use las opciones de `auth.ts`; verificar que `GET /api/auth/providers` retorna el provider correcto
- [ ] 3.3 Crear `src/lib/auth-cliente.ts` con `NextAuthOptions` equivalente para la tabla `Cliente`; verificar igualmente
- [ ] 3.4 Crear `src/app/api/auth/cliente/[...nextauth]/route.ts`; verificar que funciona independientemente de la sesión admin
- [ ] 3.5 Crear `src/middleware.ts` que proteja `/dashboard` y `/dashboard/**` con la sesión de admin, y `/mis-reservas` con la sesión de cliente; redirige al login correspondiente si no hay sesión. Verificar que acceder a `/dashboard` sin sesión redirige a `/login`
- [ ] 3.6 Crear páginas `/login` (admin) y `/registro` + `/login-cliente` (clientes) con formularios básicos usando shadcn/ui `Form`; verificar flujo completo de login/logout para cada actor

## 4. Helper de Tenant y Autorización

- [ ] 4.1 Crear `src/lib/tenant.ts` con función `getComplejoIdFromSession(session)` que extrae el `complejoId` del usuario autenticado desde `UsuarioComplejo`; verificar en un test unitario con datos mock
- [ ] 4.2 Crear función `assertTenantAccess(complejoId, session)` que lanza 403 si el usuario no tiene acceso al complejo indicado; verificar que un ADMIN del complejo A no puede acceder al complejo B
- [ ] 4.3 Crear función `assertRole(session, roles: RolComplejo[])` para verificar roles específicos; verificar que STAFF es rechazado en rutas que requieren ADMIN

## 5. API — Complejos y Cuentas Bancarias

- [ ] 5.1 Implementar `GET /api/admin/complejos` (SUPER_ADMIN): lista todos los complejos; verificar respuesta con al menos un complejo en DB
- [ ] 5.2 Implementar `POST /api/admin/complejos` (SUPER_ADMIN): crea complejo con validación Zod; verificar que slug duplicado retorna 409
- [ ] 5.3 Implementar `PATCH /api/admin/complejos/[id]` (SUPER_ADMIN): edita y desactiva complejo; verificar que `activo: false` excluye el complejo de la vista pública
- [ ] 5.4 Implementar `GET/POST/DELETE /api/dashboard/cuentas-bancarias` (ADMIN): CRUD de cuentas bancarias del complejo autenticado; verificar aislamiento (un ADMIN no puede ver cuentas de otro complejo)

## 6. API — Canchas y Horarios

- [ ] 6.1 Implementar `GET /api/dashboard/canchas` (ADMIN/STAFF): lista canchas del complejo; verificar filtro por `complejoId` de la sesión
- [ ] 6.2 Implementar `POST /api/dashboard/canchas` (ADMIN): crea cancha con validación Zod; verificar que aparece en la vista pública del complejo
- [ ] 6.3 Implementar `PATCH /api/dashboard/canchas/[id]` (ADMIN): edita y desactiva cancha; verificar que una cancha inactiva no aparece en vista pública
- [ ] 6.4 Implementar `GET/POST/DELETE /api/dashboard/horarios` (ADMIN): CRUD de `HorarioDisponible` por cancha; verificar que un horario guardado se usa en la generación de slots

## 7. API — Slots y Disponibilidad

- [ ] 7.1 Crear `src/lib/generate-slots.ts` con función `generateSlots(canchaId, fechaInicio, fechaFin)`: lee `HorarioDisponible`, genera intervalos de `duracionSlotMin`, retorna array de slots a crear; verificar con test unitario para una cancha con horario Lun-Vie 08:00-22:00
- [ ] 7.2 Implementar `POST /api/dashboard/slots/generate` (ADMIN/STAFF): llama a `generateSlots` y usa `prisma.slot.createMany({ skipDuplicates: true })`; verificar idempotencia (llamar dos veces no duplica slots)
- [ ] 7.3 Implementar `POST /api/dashboard/slots` (ADMIN/STAFF): crea slot individual; verificar que conflicto de `@@unique` retorna 409
- [ ] 7.4 Implementar `PATCH /api/dashboard/slots/[id]` (ADMIN/STAFF): cambia estado del slot; verificar que bloquear un slot RESERVADO retorna 422
- [ ] 7.5 Implementar `GET /api/slots` (público, sin auth): retorna slots DISPONIBLES de una cancha para una fecha; verificar que no expone slots BLOQUEADOS ni RESERVADOS

## 8. API — Flujo de Reservas

- [ ] 8.1 Implementar `POST /api/reservas` (público): crea reserva + cambia slot a RESERVADO en transacción Prisma; validar con Zod; verificar que una segunda petición al mismo slot retorna 409
- [ ] 8.2 Implementar `GET /api/reservas` (ADMIN/STAFF): lista reservas del complejo con filtros por estado y fecha; verificar aislamiento por `complejoId`
- [ ] 8.3 Implementar `GET /api/reservas/[id]` (ADMIN/STAFF o cliente propietario): retorna detalle de reserva con datos del slot y cancha; verificar 403 para accesos no autorizados
- [ ] 8.4 Implementar `POST /api/reservas/[id]/comprobante` (cliente o invitado): recibe URL de UploadThing, guarda en `comprobanteUrl`, cambia estado a COMPROBANTE_SUBIDO; verificar validación de formato
- [ ] 8.5 Implementar `PATCH /api/dashboard/reservas/[id]` (ADMIN/STAFF): acepta `{ estado: 'CONFIRMADA' | 'CANCELADA' }`; si CANCELADA, devuelve slot a DISPONIBLE en transacción; verificar ambos flujos
- [ ] 8.6 Verificar el flujo completo end-to-end: crear reserva → subir comprobante → confirmar; comprobar que el slot permanece RESERVADO durante todo el proceso y vuelve a DISPONIBLE solo si se cancela

## 9. Vistas Públicas

- [ ] 9.1 Crear página `src/app/(public)/[slug]/page.tsx`: muestra nombre del complejo y lista de canchas activas con su tipo y precio; verificar con un complejo de prueba
- [ ] 9.2 Crear página `src/app/(public)/[slug]/reservar/[canchaId]/page.tsx`: muestra un selector de fecha y los slots disponibles del día seleccionado; verificar que los slots se actualizan al cambiar la fecha
- [ ] 9.3 Crear formulario de reserva con campos `nombreCliente`, `telefonoCliente`, `emailCliente` (opcional); al enviar llama a `POST /api/reservas`; verificar que tras éxito muestra las instrucciones de pago y un mensaje de confirmación
- [ ] 9.4 Crear página `src/app/(public)/[slug]/reservar/[canchaId]/comprobante/[reservaId]/page.tsx`: muestra formulario de subida de archivo con UploadThing; al subir llama al endpoint de comprobante; verificar cambio de estado
- [ ] 9.5 Crear página `src/app/(public)/mis-reservas/page.tsx` (solo clientes autenticados): lista historial de reservas del cliente con su estado; verificar que solo muestra reservas del cliente autenticado

## 10. Dashboard — Administradores

- [ ] 10.1 Crear layout `src/app/dashboard/layout.tsx` con sidebar de navegación (Agenda, Reservas, Canchas, Horarios, Slots, Configuración) y header con nombre del complejo y botón logout; verificar que el layout protege correctamente sin sesión
- [ ] 10.2 Crear página `src/app/dashboard/page.tsx`: muestra reservas del día actual agrupadas por cancha con badge de estado; verificar con reservas de prueba
- [ ] 10.3 Crear página `src/app/dashboard/reservas/page.tsx`: tabla de reservas con filtros por estado y fecha; verificar filtrado por COMPROBANTE_SUBIDO
- [ ] 10.4 Crear página `src/app/dashboard/reservas/[id]/page.tsx`: detalle de reserva con visualización del comprobante (imagen) y botones Confirmar/Cancelar; verificar que el botón llama al endpoint y actualiza el estado en UI
- [ ] 10.5 Crear páginas de gestión de canchas `src/app/dashboard/canchas/`: lista y formulario de creación/edición; verificar que una cancha creada aparece inmediatamente en la vista pública
- [ ] 10.6 Crear página de horarios `src/app/dashboard/horarios/page.tsx`: grid semanal para definir horaApertura/horaCierre por día; verificar guardado correcto
- [ ] 10.7 Crear página de slots `src/app/dashboard/slots/page.tsx`: calendario con slots del día, botones para crear slot manual o bloquear/desbloquear existente; verificar anti-overbooking (slot RESERVADO no se puede bloquear)
- [ ] 10.8 Crear página de configuración `src/app/dashboard/configuracion/page.tsx` (solo ADMIN): formulario de datos del complejo y sección de cuentas bancarias (listar, añadir, desactivar); verificar que STAFF recibe 403 al intentar acceder

## 11. Panel Super Admin

- [ ] 11.1 Crear layout `src/app/admin/layout.tsx` con verificación de `esSuperAdmin = true`; verificar redirección de ADMIN a `/dashboard`
- [ ] 11.2 Crear página `src/app/admin/complejos/page.tsx`: tabla de todos los complejos con opciones de activar/desactivar; verificar que desactivar oculta el complejo de la vista pública
- [ ] 11.3 Crear página `src/app/admin/usuarios/page.tsx`: lista usuarios administradores, formulario para crear usuario y asignarlo a complejo con rol; verificar que el nuevo usuario puede iniciar sesión

## 12. Validación Final

- [ ] 12.1 Ejecutar `npx prisma validate` para confirmar integridad del schema final
- [ ] 12.2 Ejecutar `npm run build` para verificar que no hay errores de TypeScript ni de compilación de Next.js
- [ ] 12.3 Probar flujo completo de overbooking: abrir dos pestañas del navegador, intentar reservar el mismo slot simultáneamente y verificar que solo una reserva tiene éxito
- [ ] 12.4 Probar aislamiento de tenant: con dos complejos en DB, verificar que un ADMIN del complejo A no puede ver ni modificar datos del complejo B mediante manipulación de IDs en la URL
- [ ] 12.5 Probar flujo completo como invitado: reservar → subir comprobante → admin confirma → verificar estados en cada paso
