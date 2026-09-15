## Purpose

Define el ciclo completo de una reserva: desde la selección de un slot disponible por parte del jugador hasta la confirmación final por el administrador tras validar el comprobante de pago. Soporta tanto jugadores invitados (sin cuenta) como jugadores con cuenta registrada.

## ADDED Requirements

### Requirement: Creación de reserva por jugador
El sistema SHALL permitir crear una reserva para un slot disponible. El jugador DEBE proveer nombre, teléfono y email (opcional si es invitado) o estar autenticado como Cliente. El slot pasa a estado RESERVADO en la misma transacción.

#### Scenario: Reserva como invitado exitosa
- **WHEN** un visitante envía slotId, nombreCliente y telefonoCliente válidos para un slot DISPONIBLE
- **THEN** el sistema crea la reserva en estado PENDIENTE_PAGO, el slot cambia a RESERVADO, y la respuesta incluye las instrucciones de pago (cuentas bancarias del complejo)

#### Scenario: Reserva en slot no disponible
- **WHEN** un visitante intenta reservar un slot en estado RESERVADO o BLOQUEADO
- **THEN** el sistema rechaza con error 409

#### Scenario: Reserva como cliente autenticado
- **WHEN** un Cliente autenticado crea una reserva
- **THEN** el sistema asocia la reserva al `clienteId` y sus datos de perfil se pre-rellenan

### Requirement: Subida de comprobante de pago
El sistema SHALL permitir al jugador (invitado o autenticado) subir un archivo de imagen como comprobante de pago de una reserva en estado PENDIENTE_PAGO. La reserva cambia a COMPROBANTE_SUBIDO.

#### Scenario: Subir comprobante válido
- **WHEN** el jugador sube una imagen (JPG, PNG, PDF ≤ 5MB) para una reserva PENDIENTE_PAGO
- **THEN** el sistema almacena el archivo, guarda la URL en `comprobanteUrl` y cambia el estado a COMPROBANTE_SUBIDO

#### Scenario: Formato de archivo inválido
- **WHEN** el jugador intenta subir un archivo con extensión no permitida
- **THEN** el sistema rechaza con error 422

### Requirement: Confirmación de reserva por administrador
El sistema SHALL permitir al ADMIN o STAFF cambiar el estado de una reserva de COMPROBANTE_SUBIDO a CONFIRMADA tras validar el comprobante.

#### Scenario: Confirmar reserva
- **WHEN** el ADMIN cambia el estado de una reserva COMPROBANTE_SUBIDO a CONFIRMADA
- **THEN** el sistema actualiza el estado y registra el timestamp de confirmación

#### Scenario: STAFF puede confirmar
- **WHEN** un usuario con rol STAFF en el complejo confirma una reserva
- **THEN** el sistema acepta la operación igual que si fuera un ADMIN

### Requirement: Cancelación de reserva
El sistema SHALL permitir cancelar una reserva en cualquier estado (excepto CONFIRMADA sin autorización explícita de ADMIN). Al cancelar, el slot vuelve a estado DISPONIBLE.

#### Scenario: ADMIN cancela reserva
- **WHEN** el ADMIN cancela una reserva en cualquier estado
- **THEN** la reserva pasa a CANCELADA y el slot asociado vuelve a DISPONIBLE

#### Scenario: Jugador cancela reserva PENDIENTE_PAGO
- **WHEN** el jugador propietario de una reserva PENDIENTE_PAGO solicita cancelación
- **THEN** la reserva pasa a CANCELADA y el slot vuelve a DISPONIBLE

### Requirement: Instrucciones de pago en la respuesta de reserva
El sistema SHALL incluir en la respuesta de creación de reserva las cuentas bancarias activas del complejo para que el jugador sepa a dónde transferir.

#### Scenario: Instrucciones incluidas
- **WHEN** se crea una reserva exitosamente
- **THEN** la respuesta incluye al menos una cuenta bancaria activa del complejo con banco, número, tipo y titular
