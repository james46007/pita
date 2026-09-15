## Purpose

Panel privado web accesible en `/dashboard` para usuarios ADMIN y STAFF. Centraliza la gestión operativa del complejo: vista de agenda diaria, confirmación de comprobantes, administración de canchas, horarios y slots.

## ADDED Requirements

### Requirement: Vista de agenda del día
El sistema SHALL mostrar al ADMIN/STAFF en la página principal del dashboard todas las reservas del día actual agrupadas por cancha, con su estado y datos del cliente.

#### Scenario: Agenda del día con reservas
- **WHEN** un ADMIN accede al dashboard
- **THEN** el sistema muestra todas las reservas del día ordenadas por hora de inicio para su complejo

#### Scenario: Agenda sin reservas
- **WHEN** no hay reservas para el día actual
- **THEN** el sistema muestra un mensaje indicando que no hay reservas para hoy

### Requirement: Gestión de reservas desde dashboard
El sistema SHALL permitir al ADMIN/STAFF ver el detalle de cada reserva, visualizar el comprobante y confirmar o cancelar la reserva.

#### Scenario: Ver comprobante
- **WHEN** el ADMIN abre una reserva en estado COMPROBANTE_SUBIDO
- **THEN** el sistema muestra la imagen del comprobante y los botones de Confirmar y Cancelar

#### Scenario: Filtrar reservas por estado
- **WHEN** el ADMIN filtra la lista de reservas por estado COMPROBANTE_SUBIDO
- **THEN** el sistema muestra solo las reservas que requieren revisión

### Requirement: Gestión de slots manuales desde dashboard
El sistema SHALL proporcionar una interfaz en el dashboard para crear slots individuales y cambiar el estado de slots existentes (bloquear/desbloquear).

#### Scenario: Crear slot desde dashboard
- **WHEN** el ADMIN selecciona una cancha, fecha y hora de inicio desde el dashboard
- **THEN** el sistema crea el slot y lo refleja en la vista de disponibilidad pública

### Requirement: Configuración del complejo desde dashboard
El sistema SHALL permitir al ADMIN editar los datos del complejo (nombre, teléfono, dirección) y gestionar las cuentas bancarias desde el dashboard. Esta sección NO está disponible para STAFF.

#### Scenario: Editar datos del complejo
- **WHEN** el ADMIN actualiza el nombre del complejo
- **THEN** el sistema guarda el cambio y lo refleja en la vista pública
