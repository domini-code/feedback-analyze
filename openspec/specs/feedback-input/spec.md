## ADDED Requirements

### Requirement: Ingresar feedback en texto libre
El sistema SHALL proporcionar un área de texto donde el usuario puede escribir o pegar múltiples entradas de feedback, una por línea.

#### Scenario: Usuario ingresa múltiples entradas
- **WHEN** el usuario escribe o pega texto con varias líneas en el área de entrada
- **THEN** el sistema SHALL reconocer cada línea no vacía como una entrada de feedback independiente

#### Scenario: Líneas vacías ignoradas
- **WHEN** el texto ingresado contiene líneas en blanco entre entradas
- **THEN** el sistema SHALL ignorar las líneas vacías y procesar solo las líneas con contenido

### Requirement: Enviar feedback para clasificación
El sistema SHALL incluir un botón de envío que inicia el proceso de clasificación para todas las entradas ingresadas.

#### Scenario: Envío con entradas válidas
- **WHEN** el usuario hace clic en el botón "Clasificar" y hay al menos una línea de texto no vacía
- **THEN** el sistema SHALL deshabilitar el botón, mostrar indicador de carga y enviar las entradas al endpoint de clasificación

#### Scenario: Intento de envío vacío
- **WHEN** el usuario hace clic en "Clasificar" y el área de texto está vacía o solo contiene espacios en blanco
- **THEN** el sistema SHALL mostrar un mensaje de validación y NO SHALL enviar la solicitud

#### Scenario: Límite de entradas excedido
- **WHEN** el usuario intenta enviar más de 50 líneas no vacías
- **THEN** el sistema SHALL mostrar un mensaje indicando el límite y NOT SHALL procesar el envío
