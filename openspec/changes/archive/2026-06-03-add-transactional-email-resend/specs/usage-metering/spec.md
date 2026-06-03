## MODIFIED Requirements

### Requirement: Cuota gratuita de 5 análisis por mes
El sistema SHALL limitar a los usuarios con plan `free` a 5 análisis por mes natural; los usuarios `pro` SHALL ser ilimitados. Cuando el límite es alcanzado, el sistema SHALL también notificar al usuario por email con un enlace directo al checkout.

#### Scenario: Usuario free por debajo del límite
- **WHEN** un usuario `free` con menos de 5 análisis este mes envía `POST /api/analyze-feedback`
- **THEN** el sistema SHALL procesar la clasificación normalmente y persistir el análisis

#### Scenario: Usuario free alcanza el límite
- **WHEN** un usuario `free` con 5 análisis ya registrados este mes envía `POST /api/analyze-feedback`
- **THEN** el sistema SHALL responder HTTP 402 con cuerpo `{ "error": "free_limit_reached", "limit": 5 }`, sin invocar a la API de Claude ni escribir en `analyses`, y SHALL invocar `sendLimitReachedEmail(userEmail, checkoutUrl)` de forma no bloqueante donde `checkoutUrl` es `${NEXT_PUBLIC_APP_URL}/api/checkout` — un fallo en el envío del email NOT SHALL cambiar el status code ni el cuerpo de la respuesta HTTP 402

#### Scenario: Usuario pro sin límite
- **WHEN** un usuario `pro` envía `POST /api/analyze-feedback` con cualquier número de análisis previos
- **THEN** el sistema SHALL procesar la clasificación sin aplicar el límite de cuota
