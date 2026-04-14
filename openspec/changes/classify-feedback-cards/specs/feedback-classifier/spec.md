## ADDED Requirements

### Requirement: Clasificar feedback en categorías accionables
El sistema SHALL clasificar cada entrada de feedback en exactamente una de las siguientes categorías: `bug`, `feature-request`, `praise`, `pain-point`.

#### Scenario: Clasificación exitosa de una entrada
- **WHEN** el endpoint `/api/classify` recibe una entrada de texto de feedback
- **THEN** el sistema SHALL retornar `{ category, confidence }` donde `category` es uno de los cuatro valores permitidos y `confidence` es un número entre 0 y 1

#### Scenario: Clasificación en paralelo de múltiples entradas
- **WHEN** el endpoint recibe un array de N entradas de texto
- **THEN** el sistema SHALL clasificar todas las entradas en paralelo y retornar un array de N resultados en el mismo orden

### Requirement: Usar schema estricto para la respuesta de Claude
El sistema SHALL usar `tool_use` de la API de Claude con un JSON schema que restrinja `category` a los cuatro valores literales.

#### Scenario: Output siempre estructurado
- **WHEN** Claude procesa una entrada de feedback
- **THEN** el sistema SHALL recibir siempre un objeto JSON válido con `category` y `confidence`, sin necesidad de parseo de texto libre

### Requirement: Manejo de errores de clasificación
El sistema SHALL manejar fallos en la API de Claude sin interrumpir las demás clasificaciones del batch.

#### Scenario: Fallo en una entrada del batch
- **WHEN** la llamada a Claude falla para una entrada específica
- **THEN** el sistema SHALL retornar `{ category: "error", confidence: 0, error: "<mensaje>" }` para esa entrada y continuar procesando las demás

#### Scenario: API key no configurada
- **WHEN** la variable de entorno `ANTHROPIC_API_KEY` no está presente al arrancar el servidor
- **THEN** el sistema SHALL retornar HTTP 500 con mensaje de error descriptivo
