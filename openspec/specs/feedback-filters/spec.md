## ADDED Requirements

### Requirement: Filtrar cards por categoría
El sistema SHALL proporcionar controles de filtro que permitan al usuario mostrar solo las cards de una o más categorías seleccionadas.

#### Scenario: Filtro de categoría única
- **WHEN** el usuario selecciona únicamente la categoría "bug"
- **THEN** el sistema SHALL mostrar solo las cards con `category === "bug"` y ocultar las demás

#### Scenario: Filtro de múltiples categorías
- **WHEN** el usuario selecciona "bug" y "feature-request"
- **THEN** el sistema SHALL mostrar cards de ambas categorías simultáneamente

#### Scenario: Sin filtros activos muestra todas las cards
- **WHEN** ningún filtro de categoría está activo (estado inicial o tras deseleccionar todos)
- **THEN** el sistema SHALL mostrar todas las cards disponibles

### Requirement: Contador de items por categoría en los filtros
El sistema SHALL mostrar junto a cada botón de filtro el número de cards que pertenecen a esa categoría.

#### Scenario: Contador refleja el total sin filtrar
- **WHEN** se muestran los controles de filtro
- **THEN** cada filtro SHALL mostrar el conteo total de cards en esa categoría, independientemente de los filtros activos

### Requirement: Actualización en tiempo real
El sistema SHALL actualizar la vista de cards instantáneamente al cambiar los filtros activos, sin ninguna llamada al servidor.

#### Scenario: Cambio de filtro instantáneo
- **WHEN** el usuario hace clic en un botón de filtro
- **THEN** las cards SHALL mostrarse u ocultarse de forma inmediata (en el mismo frame de render), sin loading state
