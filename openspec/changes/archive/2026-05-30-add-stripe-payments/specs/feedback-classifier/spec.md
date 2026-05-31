## MODIFIED Requirements

### Requirement: Clasificar feedback en categorías accionables
El sistema SHALL clasificar cada entrada de feedback en exactamente una de las siguientes categorías: `bug`, `feature_request`, `elogio`, `pain_point`, `no_clasificable`. El endpoint `POST /api/analyze-feedback` SHALL requerir una sesión autenticada de Supabase y SHALL rechazar llamadas anónimas con HTTP 401. El endpoint SHALL aplicar la cuota del plan del caller: un usuario `free` que ya tiene 5 análisis en el mes natural actual SHALL recibir HTTP 402 antes de invocar a Claude; un usuario `pro` SHALL ser ilimitado (detalle en la capacidad `usage-metering`). Toda clasificación exitosa SHALL ser persistida en la tabla `public.analyses` asociada al `user_id` del caller (contrato detallado en la capacidad `analysis-persistence`).

#### Scenario: Clasificación exitosa de múltiples entradas
- **WHEN** el endpoint `POST /api/analyze-feedback` recibe `{ feedback: string }` con entradas separadas por salto de línea desde un usuario autenticado dentro de su cuota
- **THEN** el sistema SHALL retornar el siguiente schema:
  ```json
  {
    "items": [{ "text": "string", "category": "bug|feature_request|elogio|pain_point|no_clasificable", "sentiment": "positive|negative|neutral" }],
    "summary": {
      "total": "number",
      "by_category": { "bug": "n", "feature_request": "n", "elogio": "n", "pain_point": "n", "no_clasificable": "n" },
      "overall_sentiment": "positive|negative|neutral|mixed"
    }
  }
  ```

#### Scenario: Clasificación en paralelo de múltiples entradas
- **WHEN** el endpoint recibe N entradas separadas por `\n`
- **THEN** el sistema SHALL clasificar todas las entradas en paralelo y retornar un array de N resultados en el mismo orden

#### Scenario: Request sin sesión autenticada
- **WHEN** `POST /api/analyze-feedback` recibe una request sin cookie de sesión válida de Supabase
- **THEN** el sistema SHALL retornar HTTP 401 con cuerpo `{ "error": "unauthorized" }` sin invocar a la API de Claude ni escribir en la base de datos

#### Scenario: Usuario free supera la cuota mensual
- **WHEN** un usuario autenticado con plan `free` y 5 análisis ya registrados en el mes natural actual envía `POST /api/analyze-feedback`
- **THEN** el sistema SHALL retornar HTTP 402 con cuerpo `{ "error": "free_limit_reached", "limit": 5 }` sin invocar a la API de Claude ni escribir en `analyses`

#### Scenario: Orden de comprobaciones antes de clasificar
- **WHEN** llega una request autenticada
- **THEN** el sistema SHALL verificar la sesión (401 si falta), luego el plan y la cuota (402 si el usuario `free` está en el límite), y sólo entonces invocar a Claude — los usuarios `pro` omiten la comprobación de cuota

#### Scenario: Request autenticada dentro de cuota persiste el análisis
- **WHEN** la clasificación completa con éxito para un usuario autenticado dentro de su cuota
- **THEN** el sistema SHALL insertar una fila en `public.analyses` con `user_id` igual al usuario autenticado antes de retornar la respuesta HTTP 200
