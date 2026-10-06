# Design: Arquitectura de Integración Bot (pita + n8n)

## Contexto y Decisiones de Arquitectura
1. **Desacoplamiento Total**: La orquestación conversacional, persistencia de estados de chat y delays anti-baneo viven en el servicio independiente `pita-chatbot-n8n` (Docker/n8n).
2. **API Bot en pita**: `pita` actúa como única fuente de verdad y autoridad transaccional de reservas y slots. No gestiona estados conversacionales.
3. **Autenticación Simple y Robusta**: Un guard middleware/helper `verifyBotAuth(req)` verifica la variable `PITA_BOT_SECRET_KEY`.

## Endpoints en pita (`src/app/api/bot/...`)

### 1. `GET /api/bot/complejo?instance=<instanceName>`
- Resuelve `ComplexWhatsappConfig` por `instanceName`.
- Retorna datos básicos del complejo, canchas y cuentas bancarias.

### 2. `GET /api/bot/disponibilidad?instance=<instanceName>&fecha=YYYY-MM-DD`
- Resuelve el complejo de la instancia.
- Invoca `cleanupExpiredBookings()` para liberar slots impagos.
- Retorna slots en estado `AVAILABLE` para todas las canchas del complejo en dicha fecha.

### 3. `POST /api/bot/reservas`
- Valida payload con Zod (`instance`, `slotId`, `customerName`, `customerPhone`, `notes`).
- Ejecuta transacción `$transaction` atómica:
  - Verifica que el slot esté `AVAILABLE`.
  - Crea el `Booking` en estado `PENDIENTE_PAGO`.
  - Actualiza el `Slot` a `RESERVED`.
- Retorna `bookingId`, resumen de la reserva y cuentas bancarias activas.

### 4. `POST /api/bot/comprobante`
- Recibe multipart con archivo y `instance`, `customerPhone` (o `bookingId` si se conoce).
- Busca la reserva más reciente en `PENDIENTE_PAGO` de dicho teléfono en ese complejo.
- Sube archivo a Supabase Storage y actualiza el estado a `COMPROBANTE_SUBIDO`.
