# Tasks: Chatbot n8n Multitenant Integration

## Phase 1: Authentication Guard
- [x] 1.1 Crear helper de autenticación `src/lib/bot-auth.ts` para validar `PITA_BOT_SECRET_KEY`.

## Phase 2: Bot Endpoints in pita
- [x] 2.1 Implementar `GET /api/bot/complejo/route.ts` para consulta de complejo por `instanceName`.
- [x] 2.2 Implementar `GET /api/bot/disponibilidad/route.ts` con consulta consolidada de slots y limpieza de expirados.
- [x] 2.3 Implementar `POST /api/bot/reservas/route.ts` con transacción atómica anti-overbooking.
- [x] 2.4 Implementar `POST /api/bot/comprobante/route.ts` para recepción de comprobantes por número de teléfono.

## Phase 3: Verificación
- [x] 3.1 Probar llamadas a `/api/bot/*` con y sin token.
- [x] 3.2 Verificar que el typecheck de TypeScript pase sin errores en los archivos creados.
