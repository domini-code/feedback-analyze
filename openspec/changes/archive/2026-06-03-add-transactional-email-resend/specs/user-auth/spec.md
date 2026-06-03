## MODIFIED Requirements

### Requirement: Sign-up con email y contraseña
El sistema SHALL permitir a un visitante crear una cuenta proporcionando email y contraseña a través de Supabase Auth. Tras el registro exitoso, el sistema SHALL también enviar un email de bienvenida al nuevo usuario.

#### Scenario: Sign-up exitoso
- **WHEN** un visitante envía el formulario en `/sign-up` con un email válido no registrado y una contraseña de al menos 8 caracteres
- **THEN** Supabase SHALL crear una fila en `auth.users`, el sistema SHALL establecer la cookie de sesión y redirigir al usuario a `/` con una sesión activa, y SHALL invocar `sendWelcomeEmail(email)` de forma no bloqueante — un fallo en el envío del email NOT SHALL impedir el redirect ni la sesión

#### Scenario: Email ya registrado
- **WHEN** el email enviado en `/sign-up` ya existe en `auth.users`
- **THEN** el sistema SHALL mostrar un mensaje de error indicando que el email ya está registrado, NOT SHALL establecer una sesión, y NOT SHALL enviar email de bienvenida

#### Scenario: Contraseña demasiado corta
- **WHEN** la contraseña enviada tiene menos de 8 caracteres
- **THEN** el sistema SHALL rechazar el envío en cliente antes de llamar a Supabase y mostrar un mensaje de error junto al campo, y NOT SHALL enviar email de bienvenida
