## ADDED Requirements

### Requirement: Tabla `analyses` con user_id y RLS
El sistema SHALL persistir cada análisis de feedback en la tabla `public.analyses` en Supabase, asociada al `user_id` del usuario autenticado, con Row Level Security activa.

#### Scenario: Esquema de la tabla
- **WHEN** se aplica la migración inicial
- **THEN** la tabla `public.analyses` SHALL existir con las columnas `id uuid primary key`, `user_id uuid not null references auth.users(id) on delete cascade`, `input_text text not null`, `items jsonb not null`, `summary jsonb not null`, `created_at timestamptz not null default now()`

#### Scenario: Índice para el historial
- **WHEN** se aplica la migración
- **THEN** el sistema SHALL crear un índice compuesto `(user_id, created_at desc)` sobre `public.analyses`

#### Scenario: RLS activa
- **WHEN** la migración finaliza
- **THEN** `row_security = on` SHALL estar habilitado en `public.analyses`

### Requirement: Políticas RLS — el usuario solo ve lo suyo
El sistema SHALL aplicar políticas RLS que restrinjan lecturas e inserciones de `analyses` al propio usuario.

#### Scenario: Un usuario no puede leer análisis de otro
- **WHEN** el usuario `A` (autenticado) ejecuta `select * from analyses` y existen filas con `user_id = B`
- **THEN** la consulta SHALL retornar únicamente las filas donde `user_id = A` — cero filas cuando `A` no tiene análisis, independientemente de cuántas existan para otros usuarios

#### Scenario: Un usuario no puede insertar análisis con user_id ajeno
- **WHEN** el usuario `A` intenta insertar una fila con `user_id = B`
- **THEN** la política `insert` SHALL rechazar la operación con error de RLS

#### Scenario: Update y delete no permitidos vía API pública
- **WHEN** un cliente autenticado intenta hacer `update` o `delete` sobre una fila de `analyses`
- **THEN** la operación SHALL ser rechazada por ausencia de política — las filas son inmutables desde el punto de vista del usuario en esta iteración

### Requirement: Persistencia en cada análisis exitoso
El sistema SHALL insertar una fila en `analyses` cada vez que `POST /api/analyze-feedback` retorne una clasificación exitosa.

#### Scenario: Inserción tras clasificación
- **WHEN** `POST /api/analyze-feedback` completa la clasificación correctamente para un usuario autenticado
- **THEN** el sistema SHALL insertar una fila con `user_id = <usuario autenticado>`, `input_text = <feedback enviado>`, `items = <items clasificados>`, `summary = <resumen>` antes de retornar la respuesta HTTP

#### Scenario: Fallo de inserción no bloquea la respuesta
- **WHEN** la clasificación es exitosa pero el `insert` en `analyses` falla
- **THEN** el sistema SHALL registrar el error en los logs del servidor y retornar la respuesta de clasificación con HTTP 200, preservando el contrato existente de la API

### Requirement: Vista de historial del usuario
El sistema SHALL exponer una ruta `/history` que lista los análisis del usuario autenticado, del más reciente al más antiguo.

#### Scenario: Listado paginado del historial
- **WHEN** un usuario autenticado solicita `/history`
- **THEN** el sistema SHALL renderizar sus análisis ordenados por `created_at desc`, mostrando para cada uno la fecha, un resumen (`summary.total` y `summary.overall_sentiment`) y un enlace al detalle

#### Scenario: Historial vacío
- **WHEN** un usuario autenticado sin análisis previos solicita `/history`
- **THEN** el sistema SHALL renderizar un estado vacío con un CTA para ir al analizador

#### Scenario: Visitante anónimo solicita historial
- **WHEN** un visitante sin sesión solicita `/history`
- **THEN** el middleware SHALL redirigir a `/sign-in?redirectTo=/history`

### Requirement: Detalle de un análisis
El sistema SHALL permitir abrir cualquier análisis del usuario autenticado desde el historial.

#### Scenario: Apertura de un análisis propio
- **WHEN** un usuario autenticado navega a `/history/<analysis_id>` correspondiente a una fila con `user_id` igual al suyo
- **THEN** el sistema SHALL renderizar el `input_text` original junto con `items` y `summary`

#### Scenario: Intento de abrir análisis ajeno
- **WHEN** un usuario autenticado navega a `/history/<analysis_id>` correspondiente a una fila con `user_id` distinto
- **THEN** la consulta SHALL retornar cero filas por RLS, y el sistema SHALL responder con HTTP 404
