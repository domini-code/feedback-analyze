## ADDED Requirements

### Requirement: Clasificar feedback en categorías accionables
El sistema SHALL clasificar cada entrada de feedback en exactamente una de las siguientes categorías: `bug`, `feature_request`, `elogio`, `pain_point`, `no_clasificable`. El endpoint `POST /api/analyze-feedback` SHALL requerir una sesión autenticada de Supabase y SHALL rechazar llamadas anónimas con HTTP 401. Toda clasificación exitosa SHALL ser persistida en la tabla `public.analyses` asociada al `user_id` del caller (contrato detallado en la capacidad `analysis-persistence`).

#### Scenario: Clasificación exitosa de múltiples entradas
- **WHEN** el endpoint `POST /api/analyze-feedback` recibe `{ feedback: string }` con entradas separadas por salto de línea desde un usuario autenticado
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

#### Scenario: Request autenticada persiste el análisis
- **WHEN** la clasificación completa con éxito para un usuario autenticado
- **THEN** el sistema SHALL insertar una fila en `public.analyses` con `user_id` igual al usuario autenticado antes de retornar la respuesta HTTP 200

### Requirement: Usar schema estricto para la respuesta de Claude
El sistema SHALL usar `tool_use` de la API de Claude con un JSON schema que restrinja `category` a los cinco valores literales y `sentiment` a los tres valores permitidos.

#### Scenario: Output siempre estructurado
- **WHEN** Claude procesa una entrada de feedback
- **THEN** el sistema SHALL recibir siempre un objeto JSON válido con `category` y `sentiment`, sin necesidad de parseo de texto libre

### Requirement: Manejo de errores de clasificación
El sistema SHALL manejar fallos en la API de Claude sin interrumpir las demás clasificaciones del batch.

#### Scenario: Fallo en una entrada del batch
- **WHEN** la llamada a Claude falla para una entrada específica
- **THEN** el sistema SHALL retornar `{ text, category: "no_clasificable", sentiment: "neutral" }` para esa entrada y continuar procesando las demás

#### Scenario: API key no configurada
- **WHEN** la variable de entorno `ANTHROPIC_API_KEY` no está presente al arrancar el servidor
- **THEN** el sistema SHALL retornar HTTP 500 con mensaje de error descriptivo
