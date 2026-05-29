## ADDED Requirements

### Requirement: Sign-up con email y contraseña
El sistema SHALL permitir a un visitante crear una cuenta proporcionando email y contraseña a través de Supabase Auth.

#### Scenario: Sign-up exitoso
- **WHEN** un visitante envía el formulario en `/sign-up` con un email válido no registrado y una contraseña de al menos 8 caracteres
- **THEN** Supabase SHALL crear una fila en `auth.users`, el sistema SHALL establecer la cookie de sesión y redirigir al usuario a `/` con una sesión activa

#### Scenario: Email ya registrado
- **WHEN** el email enviado en `/sign-up` ya existe en `auth.users`
- **THEN** el sistema SHALL mostrar un mensaje de error indicando que el email ya está registrado y NOT SHALL establecer una sesión

#### Scenario: Contraseña demasiado corta
- **WHEN** la contraseña enviada tiene menos de 8 caracteres
- **THEN** el sistema SHALL rechazar el envío en cliente antes de llamar a Supabase y mostrar un mensaje de error junto al campo

### Requirement: Sign-in con email y contraseña
El sistema SHALL permitir a un usuario registrado iniciar sesión con email y contraseña.

#### Scenario: Sign-in exitoso
- **WHEN** un usuario envía credenciales válidas en `/sign-in`
- **THEN** el sistema SHALL establecer la cookie de sesión y redirigir a `/`

#### Scenario: Credenciales inválidas
- **WHEN** la combinación email/contraseña no coincide con ninguna fila en `auth.users`
- **THEN** el sistema SHALL mostrar un mensaje de error genérico ("Email o contraseña incorrectos") sin revelar si el email existe

### Requirement: Sign-in con Google OAuth
El sistema SHALL permitir iniciar sesión con una cuenta de Google a través del proveedor OAuth configurado en Supabase.

#### Scenario: Flujo OAuth exitoso
- **WHEN** el usuario hace click en "Continue with Google" y autoriza la aplicación en Google
- **THEN** Google SHALL redirigir a `/auth/callback` con un `code`, el sistema SHALL intercambiar ese código por una sesión vía `supabase.auth.exchangeCodeForSession`, y SHALL redirigir a `/`

#### Scenario: Usuario cancela en Google
- **WHEN** el usuario cancela el consentimiento en la pantalla de Google
- **THEN** el sistema SHALL redirigir de vuelta a `/sign-in` sin establecer sesión y mostrar un mensaje informativo

#### Scenario: Error al intercambiar el código
- **WHEN** `exchangeCodeForSession` falla en el callback
- **THEN** el sistema SHALL redirigir a `/sign-in?error=oauth_exchange_failed` y registrar el error en los logs del servidor

### Requirement: Sign-out
El sistema SHALL permitir a un usuario autenticado cerrar su sesión.

#### Scenario: Sign-out desde la UI
- **WHEN** el usuario activa la acción de sign-out desde el header
- **THEN** el sistema SHALL invalidar la sesión en Supabase, limpiar la cookie de sesión y redirigir a `/sign-in`

### Requirement: Protección de rutas autenticadas
El sistema SHALL impedir el acceso a rutas protegidas a visitantes sin sesión.

#### Scenario: Visitante anónimo accede a la app
- **WHEN** un visitante sin cookie de sesión válida solicita `/` o `/history`
- **THEN** el middleware SHALL redirigir a `/sign-in?redirectTo=<ruta original>`

#### Scenario: Usuario autenticado es redirigido desde páginas de auth
- **WHEN** un usuario con sesión activa solicita `/sign-in` o `/sign-up`
- **THEN** el middleware SHALL redirigir a `/`

#### Scenario: Refresco automático de la sesión
- **WHEN** el middleware procesa una request con un token de acceso expirado pero refresh token válido
- **THEN** el sistema SHALL refrescar la sesión y escribir la cookie actualizada antes de pasar la request al handler

### Requirement: Acceso al usuario actual desde Server Components
El sistema SHALL exponer el usuario autenticado a Server Components y Server Actions a través de un cliente Supabase del lado servidor.

#### Scenario: Lectura en Server Component
- **WHEN** un Server Component llama a `createClient().auth.getUser()` dentro de una ruta protegida
- **THEN** el sistema SHALL retornar el objeto `User` de Supabase correspondiente a la cookie de sesión

#### Scenario: Ausencia de sesión en Server Component de ruta pública
- **WHEN** un Server Component de una ruta pública llama a `getUser()` sin sesión presente
- **THEN** el sistema SHALL retornar `{ data: { user: null }, error: null }` sin lanzar
