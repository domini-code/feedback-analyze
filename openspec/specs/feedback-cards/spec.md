## ADDED Requirements

### Requirement: Mostrar cada resultado como una card
El sistema SHALL renderizar cada entrada clasificada como una card individual que muestra: el texto original del feedback, la categoría asignada como etiqueta visual (badge), y el porcentaje de confianza.

#### Scenario: Card con todos sus datos
- **WHEN** una entrada ha sido clasificada exitosamente
- **THEN** el sistema SHALL mostrar una card con el texto completo, un badge con el nombre de la categoría en el idioma de la UI, y la confianza formateada como porcentaje (ej. "92%")

#### Scenario: Distinción visual por categoría
- **WHEN** se muestran cards de diferentes categorías
- **THEN** cada categoría SHALL tener un color de badge distinto: `bug` → rojo, `feature-request` → azul, `praise` → verde, `pain-point` → amarillo/naranja

### Requirement: Estado de carga por card
El sistema SHALL mostrar cards en estado skeleton/loading mientras la clasificación está en curso.

#### Scenario: Carga en progreso
- **WHEN** el usuario ha enviado el feedback y la respuesta aún no ha llegado
- **THEN** el sistema SHALL mostrar N cards en estado skeleton (una por entrada enviada) para indicar que el procesamiento está en curso

### Requirement: Persistir cards entre sesiones
El sistema SHALL guardar las cards clasificadas en `localStorage` y restaurarlas al recargar la página.

#### Scenario: Recarga de página con historial
- **WHEN** el usuario recarga la página después de haber clasificado feedback
- **THEN** el sistema SHALL restaurar todas las cards previamente clasificadas desde `localStorage`

#### Scenario: Nuevas clasificaciones se agregan al historial
- **WHEN** el usuario envía un nuevo batch de feedback
- **THEN** las nuevas cards SHALL agregarse a las existentes (no reemplazarlas)
