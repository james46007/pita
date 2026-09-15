## Purpose

Gestiona la identidad y el acceso al sistema para dos tipos de actores: administradores/staff de complejos (con acceso al dashboard) y jugadores/clientes (con acceso a su historial de reservas). Un SUPER_ADMIN tiene acceso global a la plataforma.

## ADDED Requirements

### Requirement: Autenticación de administradores y staff
El sistema SHALL autenticar a usuarios con roles SUPER_ADMIN, ADMIN y STAFF mediante email y contraseña. La sesión es independiente de la sesión de clientes.

#### Scenario: Login exitoso de admin
- **WHEN** un usuario envía email y contraseña válidos
- **THEN** el sistema crea una sesión y retorna los datos del usuario incluyendo su rol y los complejos asociados

#### Scenario: Credenciales incorrectas
- **WHEN** un usuario envía email o contraseña incorrectos
- **THEN** el sistema retorna 401 sin revelar si el email existe

### Requirement: Roles y permisos por complejo
El sistema SHALL asignar roles a usuarios por complejo mediante la tabla pivot UsuarioComplejo. Un usuario puede tener roles distintos en complejos distintos.

#### Scenario: ADMIN accede al dashboard de su complejo
- **WHEN** un usuario con rol ADMIN en el complejo X accede al dashboard
- **THEN** el sistema le concede acceso completo a canchas, reservas, horarios y configuración de ese complejo

#### Scenario: STAFF no puede acceder a configuración
El sistema SHALL restringir a los usuarios con rol STAFF el acceso a las secciones de configuración del complejo (datos del complejo, cuentas bancarias).

- **WHEN** un STAFF intenta acceder a la sección de configuración
- **THEN** el sistema retorna 403

#### Scenario: SUPER_ADMIN accede a todo
- **WHEN** un usuario con rol SUPER_ADMIN accede a cualquier sección
- **THEN** el sistema le concede acceso sin restricción de complejo

### Requirement: Registro y autenticación de clientes (jugadores)
El sistema SHALL permitir a los jugadores crear una cuenta con nombre, email y contraseña. La sesión de clientes es independiente de la de administradores.

#### Scenario: Registro de cliente
- **WHEN** un visitante envía nombre, email único y contraseña válida
- **THEN** el sistema crea el cliente y retorna una sesión autenticada

#### Scenario: Login de cliente
- **WHEN** un cliente envía sus credenciales válidas
- **THEN** el sistema retorna una sesión con sus datos de perfil

### Requirement: Reserva sin cuenta (modo invitado)
El sistema SHALL permitir crear reservas sin autenticación, usando únicamente nombre y teléfono del cliente.

#### Scenario: Reserva como invitado
- **WHEN** un visitante no autenticado crea una reserva con nombre y teléfono
- **THEN** el sistema crea la reserva con `clienteId = null` y la reserva queda asociada solo por nombre y teléfono
