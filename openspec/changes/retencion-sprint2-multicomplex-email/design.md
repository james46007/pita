# Design: Sprint 2 — Selector Multi-Complejo y Notificación de Confirmación por Email

## Context

El layout del dashboard (`src/app/dashboard/layout.tsx`) resuelve el complejo activo hardcodeando `user.complexes?.[0]?.complexId`. El modelo `UserComplex` en Prisma ya permite N complejos por usuario. El cambio es minimal en backend — principalmente un selector en UI y una cookie de persistencia.

Para las notificaciones, `PATCH /api/dashboard/reservas/[id]` ya lee el `booking` completo de la DB (incluye `customerEmail`, `customerPhone`, `customerName`). Solo falta disparar el email post-update.

## Goals / Non-Goals

**Goals:**
- Permitir cambiar de complejo activo sin cerrar sesión.
- Enviar email automático al jugador cuando el admin confirma su reserva.
- Mantener la arquitectura sin cambios de esquema Prisma.

**Non-Goals:**
- Notificación por WhatsApp API (requiere verificación empresarial Meta, queda para Sprint 3).
- Notificación al dueño del complejo (ya tiene el dashboard).
- Multi-tenant simultáneo en la misma vista (el selector es de uno activo a la vez).

## Decisions

### 1. Persistencia del Complejo Activo

- **Decision**: Cookie HTTP-only `active-complex-id` establecida en el servidor al seleccionar, leída en `getCurrentUserAndTenant` de `src/lib/tenant.ts` como fallback cuando no hay `targetComplexId` explícito.
- **Alternativa rechazada**: URL param `?complexId=xxx` en cada ruta — genera URLs feas y se pierde al navegar.
- **Alternativa rechazada**: localStorage — no disponible en Server Components.

### 2. UI del Selector

- **Decision**: Dropdown en el sidebar del dashboard, visible solo si `user.complexes.length > 1`. Muestra el nombre del complejo activo y un ícono de switch. Al seleccionar, hace POST a `/api/dashboard/switch-complejo` que setea la cookie y redirige.
- **Rationale**: La acción de cambio de complejo es poco frecuente. No necesita ser un tab siempre visible.

### 3. Proveedor de Email — Resend

- **Decision**: `resend` npm package. Setup: 1 API key en `.env`. Free tier: 3,000 emails/mes, suficiente para los primeros 12 meses con múltiples clientes.
- **Rationale**: API minimalista (1 función `resend.emails.send()`), sin configuración SMTP, sin verificación de dominio requerida en el tier gratuito. Alternativa SendGrid tiene más fricción de setup.

### 4. Plantilla de Email de Confirmación

- **Decision**: Email HTML inline (sin framework de templates) generado en `src/lib/email/templates/booking-confirmed.ts`. Contenido: nombre jugador, complejo, cancha, fecha, horario, número de WhatsApp del complejo para consultas.
- **Rationale**: No justifica instalar un motor de templates para 1-2 plantillas en el MVP.

### 5. Manejo de Errores en el Envío

- **Decision**: El envío de email es **fire-and-forget**. Si falla, se loguea el error pero el PATCH de la reserva responde 200 de todas formas.
- **Rationale**: Un fallo en Resend no debe bloquear la operación principal de confirmar la reserva.

## Risks / Trade-offs

- **[Spam/Deliverability sin dominio propio verificado]** → Los primeros emails pueden ir a spam. Agregar verificación de dominio en Resend (gratuita) lo mitiga. Se documenta en el setup.
- **[Cookie active-complex-id puede quedar desactualizada si se revoca acceso]** → En `getCurrentUserAndTenant`, si el `complexId` de la cookie no aparece en `user.complexes`, se ignora y se usa `complexes[0]`.
