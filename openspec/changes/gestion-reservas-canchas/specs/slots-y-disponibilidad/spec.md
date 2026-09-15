## Purpose

Gestiona los slots de tiempo disponibles para reserva en cada cancha. Los slots pueden generarse automáticamente a partir de los horarios semanales o crearse y bloquearse manualmente por el administrador. El constraint único en base de datos garantiza que no existan dos reservas para el mismo slot (anti-overbooking).

## ADDED Requirements

### Requirement: Generación automática de slots
El sistema SHALL generar slots de tiempo a partir de los horarios semanales de una cancha cuando el administrador solicita generar disponibilidad para un rango de fechas.

#### Scenario: Generar slots para una semana
- **WHEN** el ADMIN solicita generar slots para la cancha X del 2024-01-01 al 2024-01-07
- **THEN** el sistema crea registros de slot en estado DISPONIBLE para cada intervalo válido según los horarios definidos, sin duplicar slots existentes

#### Scenario: Sin horario definido para un día
- **WHEN** se solicita generar slots para un día sin horario configurado
- **THEN** el sistema no crea slots para ese día

### Requirement: Creación manual de slots
El sistema SHALL permitir al ADMIN crear slots individuales para una cancha en una fecha y hora específica.

#### Scenario: Crear slot manual
- **WHEN** el ADMIN crea un slot para cancha X, fecha Y, horaInicio Z
- **THEN** el sistema crea el slot en estado DISPONIBLE si no existe ya un slot con esa combinación

#### Scenario: Conflicto de slot duplicado
- **WHEN** el ADMIN intenta crear un slot con la misma (canchaId, fecha, horaInicio) que uno existente
- **THEN** el sistema rechaza la operación con error 409

### Requirement: Bloqueo de slots
El sistema SHALL permitir al ADMIN cambiar el estado de un slot a BLOQUEADO para impedir reservas (mantenimiento, feriados, etc.).

#### Scenario: Bloquear slot disponible
- **WHEN** el ADMIN bloquea un slot en estado DISPONIBLE
- **THEN** el sistema cambia su estado a BLOQUEADO y deja de mostrarlo como disponible al público

#### Scenario: Bloquear slot reservado
- **WHEN** el ADMIN intenta bloquear un slot en estado RESERVADO
- **THEN** el sistema rechaza la operación con error 422 indicando que el slot ya tiene una reserva activa

### Requirement: Consulta pública de disponibilidad
El sistema SHALL exponer los slots en estado DISPONIBLE de una cancha para una fecha dada, accesibles sin autenticación.

#### Scenario: Consultar disponibilidad
- **WHEN** un visitante consulta los slots disponibles de la cancha X para la fecha Y
- **THEN** el sistema retorna únicamente los slots con estado DISPONIBLE, incluyendo horaInicio, horaFin y montoTotal calculado

### Requirement: Anti-overbooking por constraint de base de datos
El sistema SHALL garantizar a nivel de base de datos que no existan dos reservas confirmadas para el mismo slot, mediante un índice único `(canchaId, fecha, horaInicio)` en la tabla Slot y una relación 1:1 entre Slot y Reserva.

#### Scenario: Intento de doble reserva simultánea
- **WHEN** dos clientes intentan reservar el mismo slot al mismo tiempo
- **THEN** solo una transacción tiene éxito; la segunda recibe error 409 indicando que el slot ya no está disponible
