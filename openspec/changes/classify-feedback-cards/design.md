## Context

Proyecto Next.js greenfield. El objetivo es permitir a equipos de producto clasificar feedback de usuarios de forma automática y explorar los resultados visualmente. La clasificación se delega a la API de Claude para aprovechar su capacidad de comprensión de lenguaje natural sin necesidad de entrenar modelos propios. La app corre en el browser + server components de Next.js.

## Goals / Non-Goals

**Goals:**
- Clasificar cada entrada de feedback en exactamente una de cuatro categorías: `bug`, `feature-request`, `praise`, `pain-point`
- Mostrar los resultados como cards con categoría visible y confianza
- Permitir filtrar cards por categoría en tiempo real (client-side)
- Persistir clasificaciones en `localStorage` para sobrevivir recargas

**Non-Goals:**
- Autenticación o multi-tenancy
- Importación de archivos (CSV, Excel) — solo texto plano por ahora
- Clasificación de sub-categorías o etiquetas secundarias
- Analytics agregados / dashboards con gráficos
- Exportación de resultados

## Decisions

### 1. Clasificación vía route handler de Next.js + Anthropic SDK

**Decisión**: Crear un API route (`/api/classify`) que recibe un array de textos y retorna clasificaciones con categoría y score de confianza.

**Alternativas consideradas**:
- Clasificación client-side con WebLLM: descartada por tamaño del modelo y latencia de descarga
- Llamada directa desde el cliente a Claude API: descartada, expone la API key

**Rationale**: Mantiene la API key en servidor, permite streaming de resultados en el futuro, y sigue el patrón estándar de Next.js.

### 2. Un batch por envío, no streaming ítem por ítem

**Decisión**: El usuario envía todo el feedback de una vez y el servidor clasifica cada ítem con llamadas paralelas a Claude (Promise.all), retornando el resultado completo.

**Alternativas consideradas**:
- Streaming progresivo con Server-Sent Events: más complejo para el beneficio actual
- Clasificación ítem a ítem en serie: demasiado lento para más de 5 entradas

**Rationale**: Simplicidad de implementación; con menos de ~20 entradas el tiempo de espera es aceptable.

### 3. Prompt estructurado con JSON forzado

**Decisión**: El prompt pide a Claude que retorne JSON `{ category, confidence }` donde `category` es uno de los cuatro valores literales. Se usa `tool_use` con un schema estricto para garantizar output estructurado.

**Rationale**: Evita parseo frágil de texto libre; `tool_use` hace que Claude nunca salga del schema definido.

### 4. Estado en React + localStorage (sin base de datos)

**Decisión**: Las clasificaciones se guardan en estado React y se sincronizan con `localStorage`.

**Alternativas consideradas**:
- Supabase / base de datos: overkill para el MVP, añade complejidad de setup
- Solo estado React sin persistencia: pérdida de datos al recargar

**Rationale**: Permite demostrar la funcionalidad completa sin infraestructura adicional.

### 5. Filtros client-side sin URL params

**Decisión**: Los filtros activos se mantienen en estado React local. No se reflejan en la URL.

**Rationale**: Simplicidad; la URL compartida no es un requisito del MVP.

## Risks / Trade-offs

- **Latencia de Claude API para batches grandes** → Mitigation: mostrar skeleton/loading por card; limitar a 50 entradas por envío en el MVP
- **Costos de API con uso intensivo** → Mitigation: el prompt es corto (clasificación simple), costo por ítem es mínimo; sin caché por ahora
- **localStorage limitado a ~5MB** → Mitigation: más que suficiente para el volumen esperado; alertar si se acerca al límite es trabajo futuro
- **Pérdida de contexto entre ítems** → Mitigation: cada ítem se clasifica de forma independiente; la falta de contexto cruzado es aceptable para el MVP

## Open Questions

- ¿Se necesita un campo "fuente" por ítem (ej. App Store, Twitter, soporte)? — Diferido a post-MVP
- ¿Debería mostrarse el razonamiento de Claude además del label? — Diferido, requiere prompt más largo
