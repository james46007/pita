# bot-reservas-api Specification

## Purpose
Provee una interfaz REST protegida por token estático para que servicios externos automatizados (como n8n y chatbots de WhatsApp) consulten complejos, disponibilidad agregada de canchas, generen reservas y carguen comprobantes de pago.

## ADDED Requirements

### Requirement: Autenticación de Servicios Bot
El sistema DEBE validar el encabezado de autorización (`Authorization: Bearer <TOKEN>` o `x-bot-api-key`) contra la variable de entorno `PITA_BOT_SECRET_KEY` en todas las rutas bajo `/api/bot/*`.

#### Scenario: Petición sin token o token inválido
- **WHEN** un cliente HTTP solicita una ruta `/api/bot/*` sin token o con token incorrecto
- **THEN** el sistema responde inmediatamente con HTTP 401 Unauthorized.

#### Scenario: Petición con token válido
- **WHEN** un cliente HTTP envía el token coincidente con `PITA_BOT_SECRET_KEY`
- **THEN** el sistema procesa la solicitud con éxito.

### Requirement: Consulta de Complejo por Instancia
El sistema DEBE permitir consultar el resumen de un complejo a partir del `instanceName` de Evolution API.

#### Scenario: Instancia existente y vinculada
- **WHEN** se consulta `GET /api/bot/complejo?instance=<instanceName>`
- **THEN** el sistema responde con el id del complejo, nombre, teléfono, canchas activas y cuentas bancarias activas.

#### Scenario: Instancia no registrada
- **WHEN** se consulta con un `instanceName` no vinculado a ningún complejo
- **THEN** el sistema responde con HTTP 404 Not Found.

### Requirement: Consulta Consolidada de Disponibilidad
El sistema DEBE retornar todos los slots disponibles de un complejo para una fecha determinada en una sola llamada.

#### Scenario: Consulta de slots disponibles en una fecha
- **WHEN** se consulta `GET /api/bot/disponibilidad?instance=<instanceName>&fecha=YYYY-MM-DD`
- **THEN** el sistema ejecuta la limpieza de reservas impagas expiradas y retorna la lista de slots libres agrupados o detallados con nombre de cancha, tipo y precio.

### Requirement: Creación Atómica de Reserva vía Bot
El sistema DEBE permitir crear una reserva en estado `PENDIENTE_PAGO` bloqueando el slot dentro de una transacción atómica.

#### Scenario: Reserva exitosa por bot
- **WHEN** el bot envía `POST /api/bot/reservas` con `instance`, `slotId`, `customerPhone` y `customerName`
- **THEN** el sistema valida que el slot pertenezca al complejo de la instancia, crea la reserva atómicamente, marca el slot como `RESERVADO` y devuelve el id de reserva y las instrucciones de pago.

#### Scenario: Slot ya ocupado (Anti-overbooking)
- **WHEN** el slot solicitado ya no está en estado `AVAILABLE`
- **THEN** el sistema responde con HTTP 409 Conflict y mensaje descriptivo.
