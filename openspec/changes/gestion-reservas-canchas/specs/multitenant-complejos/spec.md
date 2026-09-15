## Purpose

Permite registrar y administrar complejos deportivos como tenants aislados dentro de la plataforma SaaS. Cada complejo tiene sus propios datos, canchas, usuarios y cuentas bancarias, sin acceso a la información de otros complejos.

## ADDED Requirements

### Requirement: Registro de complejo deportivo
El sistema SHALL permitir al SUPER_ADMIN crear un complejo deportivo con nombre, teléfono, dirección, slug único y estado activo/inactivo.

#### Scenario: Crear complejo exitosamente
- **WHEN** el SUPER_ADMIN envía nombre, teléfono, dirección y slug válidos
- **THEN** el sistema crea el complejo en estado activo y lo retorna con su `id`

#### Scenario: Slug duplicado
- **WHEN** el SUPER_ADMIN intenta crear un complejo con un slug ya existente
- **THEN** el sistema rechaza la operación con error 409 y mensaje indicando que el slug está en uso

### Requirement: Gestión de cuentas bancarias del complejo
El sistema SHALL permitir al ADMIN registrar una o más cuentas bancarias por complejo (banco, número de cuenta, tipo CORRIENTE/AHORROS, titular).

#### Scenario: Añadir cuenta bancaria
- **WHEN** el ADMIN envía datos bancarios válidos asociados a su complejo
- **THEN** el sistema guarda la cuenta y la retorna activa

#### Scenario: Múltiples cuentas bancarias
- **WHEN** el ADMIN registra más de una cuenta bancaria
- **THEN** el sistema las almacena todas y las muestra al cliente durante el flujo de reserva

### Requirement: Aislamiento de datos por complejo
El sistema SHALL asegurar que ningún usuario (ADMIN, STAFF, cliente) pueda leer ni modificar datos de un complejo diferente al suyo.

#### Scenario: ADMIN accede solo a sus datos
- **WHEN** un ADMIN autenticado consulta reservas o canchas
- **THEN** el sistema retorna únicamente registros cuyo `complejoId` corresponde al complejo del ADMIN

#### Scenario: Intento de acceso cruzado
- **WHEN** un ADMIN intenta acceder a un recurso de otro complejo mediante manipulación de IDs
- **THEN** el sistema retorna 403 Forbidden
