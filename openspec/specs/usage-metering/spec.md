## ADDED Requirements

### Requirement: Conteo de uso mensual por usuario
El sistema SHALL contar los análisis que un usuario ha realizado desde el primer día del mes natural actual, mediante `getMonthlyUsage(userId)` en `lib/usage.ts`.

#### Scenario: Conteo de análisis del mes en curso
- **WHEN** se invoca `getMonthlyUsage(userId)`
- **THEN** el sistema SHALL retornar el número de filas en `public.analyses` con `user_id = userId` y `created_at >=` el primer día del mes natural actual (00:00 del día 1)

#### Scenario: Usuario sin análisis
- **WHEN** se invoca `getMonthlyUsage(userId)` para un usuario sin análisis este mes
- **THEN** el sistema SHALL retornar `0`

#### Scenario: Reinicio en el cambio de mes
- **WHEN** comienza un nuevo mes natural
- **THEN** el conteo SHALL reiniciarse a `0`, independientemente de la fecha de alta del usuario, ya que sólo cuenta filas con `created_at` dentro del mes en curso

#### Scenario: Fallo de la consulta
- **WHEN** la consulta a Supabase falla
- **THEN** el sistema SHALL lanzar un error descriptivo en lugar de retornar un conteo erróneo

### Requirement: Cuota gratuita de 5 análisis por mes
El sistema SHALL limitar a los usuarios con plan `free` a 5 análisis por mes natural; los usuarios `pro` SHALL ser ilimitados.

#### Scenario: Usuario free por debajo del límite
- **WHEN** un usuario `free` con menos de 5 análisis este mes envía `POST /api/analyze-feedback`
- **THEN** el sistema SHALL procesar la clasificación normalmente y persistir el análisis

#### Scenario: Usuario free alcanza el límite
- **WHEN** un usuario `free` con 5 análisis ya registrados este mes envía `POST /api/analyze-feedback`
- **THEN** el sistema SHALL responder HTTP 402 con cuerpo `{ "error": "free_limit_reached", "limit": 5 }`, sin invocar a la API de Claude ni escribir en `analyses`

#### Scenario: Usuario pro sin límite
- **WHEN** un usuario `pro` envía `POST /api/analyze-feedback` con cualquier número de análisis previos
- **THEN** el sistema SHALL procesar la clasificación sin aplicar el límite de cuota
