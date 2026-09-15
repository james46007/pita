## Purpose

Permite a los administradores definir las canchas disponibles en su complejo (tipo, precio, duración de slot) y configurar los horarios semanales de disponibilidad que determinan cuándo se pueden realizar reservas.

## ADDED Requirements

### Requirement: CRUD de canchas
El sistema SHALL permitir al ADMIN crear, editar, desactivar y listar canchas de su complejo, con los campos: nombre, tipo (PADEL / SINTETICA), precio por hora y duración de slot en minutos.

#### Scenario: Crear cancha
- **WHEN** el ADMIN envía nombre, tipo, precioHora y duracionSlotMin válidos
- **THEN** el sistema crea la cancha activa asociada al complejo del ADMIN

#### Scenario: Desactivar cancha
- **WHEN** el ADMIN desactiva una cancha
- **THEN** el sistema la marca como inactiva y deja de mostrarla en la vista pública de reservas

### Requirement: Definición de horarios semanales
El sistema SHALL permitir al ADMIN definir horarios de disponibilidad por cancha y por día de la semana (0=Domingo … 6=Sábado), especificando hora de apertura y hora de cierre.

#### Scenario: Definir horario por día
- **WHEN** el ADMIN crea un horario para una cancha en un día de la semana
- **THEN** el sistema guarda el intervalo de disponibilidad para ese día

#### Scenario: Horarios distintos por día
- **WHEN** el ADMIN define horarios diferentes para Lunes y Sábado en la misma cancha
- **THEN** el sistema almacena ambos intervalos independientemente

### Requirement: Precio visible al público
El sistema SHALL mostrar el precio por hora de cada cancha en la vista pública de selección de slot.

#### Scenario: Cliente ve el precio
- **WHEN** un visitante consulta los slots disponibles de una cancha
- **THEN** el sistema incluye el campo `precioHora` en la respuesta
