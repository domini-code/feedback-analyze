## ADDED Requirements

### Requirement: Clasificar feedback en categorías accionables
El sistema SHALL clasificar cada entrada de feedback en exactamente una de las siguientes categorías: `bug`, `feature_request`, `elogio`, `pain_point`, `no_clasificable`.

#### Scenario: Clasificación exitosa de múltiples entradas
- **WHEN** el endpoint `POST /api/analyze-feedback` recibe `{ feedback: string }` con entradas separadas por salto de línea
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
