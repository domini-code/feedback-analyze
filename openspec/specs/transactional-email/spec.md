## Requirements

### Requirement: Cliente Resend compartido
El sistema SHALL exponer un cliente Resend singleton inicializado con `RESEND_API_KEY` desde `lib/email.ts`, accesible por cualquier Server Action o Route Handler.

#### Scenario: Cliente inicializado con API key
- **WHEN** `lib/email.ts` es importado en un entorno server-side
- **THEN** el módulo SHALL crear una instancia de `Resend` con `process.env.RESEND_API_KEY` y exportarla para uso interno

#### Scenario: API key ausente
- **WHEN** `RESEND_API_KEY` no está definida en el entorno
- **THEN** el cliente SHALL inicializarse igualmente (sin lanzar en import-time), pero cualquier llamada `resend.emails.send()` fallará con un error que SHALL ser capturado por el caller sin propagar al usuario

### Requirement: Envío de email de bienvenida
El sistema SHALL exponer `sendWelcomeEmail(to: string)` en `lib/email.ts` que envía un email de bienvenida tras el registro exitoso.

#### Scenario: Email de bienvenida enviado con éxito
- **WHEN** se invoca `sendWelcomeEmail("user@example.com")`
- **THEN** el sistema SHALL llamar a `resend.emails.send()` con `to` igual al email del usuario, `from` igual a `RESEND_FROM_EMAIL`, un asunto de bienvenida, y un cuerpo HTML que confirma la creación de la cuenta e invita al usuario a comenzar a analizar feedback

#### Scenario: Fallo del proveedor de email en bienvenida
- **WHEN** `resend.emails.send()` lanza un error o retorna un error en la respuesta
- **THEN** el sistema SHALL registrar el error en consola con nivel `warn` y NOT SHALL relanzar el error al caller

### Requirement: Envío de email de límite alcanzado
El sistema SHALL exponer `sendLimitReachedEmail(to: string, checkoutUrl: string)` en `lib/email.ts` que notifica al usuario que ha agotado su cuota gratuita e incluye un enlace directo al checkout.

#### Scenario: Email de límite enviado con éxito
- **WHEN** se invoca `sendLimitReachedEmail("user@example.com", "https://app.example.com/api/checkout")`
- **THEN** el sistema SHALL enviar un email con asunto que indica que el límite gratuito fue alcanzado, un cuerpo HTML que explica el límite de 5 análisis/mes del plan Free, y un botón/enlace CTA que apunta a `checkoutUrl` para actualizar al plan Pro

#### Scenario: Fallo del proveedor de email en límite
- **WHEN** `resend.emails.send()` falla durante el envío del email de límite
- **THEN** el sistema SHALL registrar el error en consola con nivel `warn` y NOT SHALL modificar la respuesta HTTP 402 ya construida

### Requirement: Envío de email de activación Pro
El sistema SHALL exponer `sendProActivationEmail(to: string)` en `lib/email.ts` que confirma al usuario que su plan Pro ha sido activado.

#### Scenario: Email de activación Pro enviado con éxito
- **WHEN** se invoca `sendProActivationEmail("user@example.com")`
- **THEN** el sistema SHALL enviar un email con asunto que confirma la activación del plan Pro, y un cuerpo HTML que agradece la suscripción, confirma análisis ilimitados, e indica el precio ($9.99/mes)

#### Scenario: Fallo del proveedor de email en activación Pro
- **WHEN** `resend.emails.send()` falla durante el envío del email de activación Pro
- **THEN** el sistema SHALL registrar el error en consola con nivel `warn` y NOT SHALL revertir el cambio de plan ya persistido en `user_plans`

### Requirement: Templates HTML para los tres emails
El sistema SHALL contener plantillas HTML en `lib/email-templates/` para cada uno de los tres tipos de email: `welcome.ts`, `limit-reached.ts`, y `pro-activation.ts`. Cada plantilla SHALL exportar una función que recibe parámetros relevantes y retorna un string HTML.

#### Scenario: Template de bienvenida
- **WHEN** se importa `lib/email-templates/welcome.ts` y se llama a su función exportada
- **THEN** SHALL retornar un string HTML válido con el saludo de bienvenida y breve descripción del producto

#### Scenario: Template de límite alcanzado con URL de checkout
- **WHEN** se importa `lib/email-templates/limit-reached.ts` y se llama a su función con `{ checkoutUrl }`
- **THEN** SHALL retornar un string HTML válido que incluye `checkoutUrl` en un enlace visible de actualización a Pro

#### Scenario: Template de activación Pro
- **WHEN** se importa `lib/email-templates/pro-activation.ts` y se llama a su función exportada
- **THEN** SHALL retornar un string HTML válido que confirma el plan Pro activo y los beneficios de análisis ilimitados
