# Proposal: Integración de Chatbot Multitenant (n8n + Evolution API)

## Why
Para atender reservas y consultas por WhatsApp de manera automatizada y escalable a través de múltiples complejos deportivos, se requiere una interfaz de programación de aplicaciones (API) segura en `pita` que permita a un servicio externo de chatbot (orquestado en n8n con Evolution API) consultar disponibilidad, registrar reservas y recepcionar comprobantes bancarios sin comprometer la seguridad ni requerir sesiones de usuario de navegador.

## What Changes
- Creación de un módulo de autenticación para servicios bot mediante token de larga duración (`PITA_BOT_SECRET_KEY` o API Key de servicio).
- Nuevo endpoint `GET /api/bot/complejo?instance=...` para resolver la información del complejo a partir del `instanceName` de Evolution API.
- Nuevo endpoint `GET /api/bot/disponibilidad?instance=...&fecha=YYYY-MM-DD` para consultar de forma consolidada todos los slots libres de todas las canchas de un complejo.
- Nuevo endpoint `POST /api/bot/reservas` para crear reservas atómicas con control anti-overbooking y asignación por número de teléfono.
- Nuevo endpoint `POST /api/bot/comprobante` para asociar la foto/PDF de pago recibida por WhatsApp a la reserva activa más reciente del cliente.

## Capabilities

### New Capabilities
- `bot-reservas-api`: Provee los endpoints de API seguros y optimizados para la interacción con bots y servicios de automatización externos (n8n / Evolution API).

### Modified Capabilities
*(Ninguna - las capacidades de usuario web, dashboard y reservas manuales se mantienen intactas).*

## Impact
- **APIs**: Se añaden nuevas rutas bajo el prefijo `/api/bot/*`.
- **Seguridad**: Se introduce la validación de encabezado `Authorization: Bearer <TOKEN>` o `x-bot-api-key`.
- **Base de Datos**: Ninguna migración destructiva requerida; se apalancan los modelos existentes `Complex`, `Slot`, `Court`, `Booking` y `ComplexWhatsappConfig`.
