## Purpose

Sección de administración global de la plataforma SaaS, accesible únicamente al SUPER_ADMIN en `/admin`. Permite crear y gestionar los complejos deportivos registrados y los usuarios administradores de cada uno.

## ADDED Requirements

### Requirement: Gestión global de complejos
El sistema SHALL permitir al SUPER_ADMIN listar, crear, editar y desactivar complejos deportivos desde el panel `/admin`.

#### Scenario: Listar todos los complejos
- **WHEN** el SUPER_ADMIN accede a `/admin/complejos`
- **THEN** el sistema muestra todos los complejos registrados con su nombre, slug y estado (activo/inactivo)

#### Scenario: Desactivar complejo
- **WHEN** el SUPER_ADMIN desactiva un complejo
- **THEN** el sistema marca el complejo como inactivo y sus canchas dejan de aparecer en la vista pública

### Requirement: Gestión de usuarios administradores
El sistema SHALL permitir al SUPER_ADMIN crear usuarios y asignarles roles ADMIN o STAFF en uno o más complejos.

#### Scenario: Crear usuario admin para un complejo
- **WHEN** el SUPER_ADMIN crea un usuario con email, nombre y contraseña, y lo asigna con rol ADMIN al complejo X
- **THEN** el sistema crea el usuario, genera el registro en UsuarioComplejo y el nuevo ADMIN puede iniciar sesión

#### Scenario: Acceso exclusivo de SUPER_ADMIN al panel
- **WHEN** un usuario con rol ADMIN intenta acceder a `/admin`
- **THEN** el sistema retorna 403 o redirige al dashboard del complejo
