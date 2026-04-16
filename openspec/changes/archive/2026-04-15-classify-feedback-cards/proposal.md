## Why

Los equipos de producto reciben feedback de usuarios de forma continua pero sin estructura, lo que dificulta priorizar qué resolver primero. Esta app automatiza la clasificación del feedback en categorías accionables — bugs, feature requests, elogios y pain points — y lo presenta como cards filtrables para que cualquier miembro del equipo pueda explorar, filtrar y actuar sobre los datos de forma inmediata.

## What Changes

- Nueva interfaz para ingresar o importar feedback de usuarios (texto libre)
- Motor de clasificación automática que asigna cada entrada a una categoría: `bug`, `feature_request`, `elogio`, `pain_point`, `no_clasificable`
- Vista de resultados como cards con etiqueta de categoría, texto original y sentimiento
- Sistema de filtros por categoría que actualiza la vista en tiempo real
- Persistencia local de las clasificaciones para no perder el historial entre sesiones

## Capabilities

### New Capabilities

- `feedback-input`: Formulario para ingresar texto de feedback manualmente o en lote (una entrada por línea)
- `feedback-classifier`: Lógica de clasificación que asigna cada fragmento de feedback a una de las cinco categorías usando la API de Claude via `POST /api/analyze-feedback`
- `feedback-cards`: Visualización de resultados como cards con categoría, texto y confianza
- `feedback-filters`: Controles de filtrado por categoría que actualizan las cards visibles en tiempo real

### Modified Capabilities

*(ninguna — proyecto nuevo)*

## Impact

- **Nueva dependencia**: Anthropic SDK (`@anthropic-ai/sdk`) para la clasificación vía Claude API
- **Archivos nuevos**: componentes React para input, cards y filtros; route handler de API para clasificación
- **Sin breaking changes** — proyecto greenfield sobre la base Next.js existente
