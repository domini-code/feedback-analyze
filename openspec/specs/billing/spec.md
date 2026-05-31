## ADDED Requirements

### Requirement: Tabla `user_plans` con plan e identificadores de Stripe
El sistema SHALL persistir el plan de cada usuario en la tabla `public.user_plans`, asociada al `user_id`, con Row Level Security activa. Un usuario sin fila SHALL ser tratado como plan `free`.

#### Scenario: Esquema de la tabla
- **WHEN** se aplica la migración inicial
- **THEN** la tabla `public.user_plans` SHALL existir con las columnas `user_id uuid primary key references auth.users(id) on delete cascade`, `plan text not null default 'free'` con `check (plan in ('free','pro'))`, `stripe_customer_id text`, `stripe_subscription_id text`, `created_at timestamptz not null default now()`, `updated_at timestamptz not null default now()`

#### Scenario: RLS activa con select propio
- **WHEN** la migración finaliza
- **THEN** `row_security = on` SHALL estar habilitado en `public.user_plans` y SHALL existir una política `select` que retorne únicamente la fila donde `auth.uid() = user_id`

#### Scenario: Usuario sin fila se considera free
- **WHEN** se consulta el plan de un usuario para el que no existe fila en `user_plans`
- **THEN** el sistema SHALL resolver su plan como `free` sin error

#### Scenario: El usuario no puede modificar su propio plan
- **WHEN** un cliente autenticado intenta `insert`, `update` o `delete` sobre `user_plans`
- **THEN** la operación SHALL ser rechazada por ausencia de política — los cambios de plan provienen exclusivamente del webhook de Stripe vía service-role

### Requirement: Crear sesión de Checkout de Stripe
El sistema SHALL exponer `POST /api/checkout` que, para un usuario autenticado, crea una sesión de Stripe Checkout en modo suscripción para el precio Pro ($9.99/mes) y retorna su URL.

#### Scenario: Usuario autenticado inicia checkout
- **WHEN** un usuario autenticado envía `POST /api/checkout`
- **THEN** el sistema SHALL crear una Checkout Session de Stripe en `mode: 'subscription'` con el precio `STRIPE_PRICE_ID_PRO`, fijando `client_reference_id` y `metadata.supabase_user_id` al `user_id` del usuario, y SHALL responder `{ "url": "<checkout_url>" }`

#### Scenario: Reutilización del customer de Stripe
- **WHEN** el usuario ya tiene `stripe_customer_id` en `user_plans`
- **THEN** la sesión SHALL asociarse a ese customer existente en lugar de crear uno nuevo

#### Scenario: Request anónima a checkout
- **WHEN** `POST /api/checkout` recibe una request sin sesión válida de Supabase
- **THEN** el sistema SHALL responder HTTP 401 sin contactar a Stripe

### Requirement: Webhook de Stripe verifica firma y activa el plan Pro
El sistema SHALL exponer `POST /api/webhooks/stripe` que verifica la firma del evento y, en `checkout.session.completed`, establece el plan del usuario en `pro`.

#### Scenario: Verificación de firma sobre el cuerpo crudo
- **WHEN** llega una request a `POST /api/webhooks/stripe`
- **THEN** el sistema SHALL leer el cuerpo crudo (sin parsear como JSON) y verificar la cabecera `stripe-signature` con `STRIPE_WEBHOOK_SECRET` antes de procesar el evento

#### Scenario: Firma inválida
- **WHEN** la verificación de la firma falla
- **THEN** el sistema SHALL responder HTTP 400 sin escribir en la base de datos

#### Scenario: Activación de Pro en checkout.session.completed
- **WHEN** se recibe y verifica un evento `checkout.session.completed` con `metadata.supabase_user_id = U`
- **THEN** el sistema SHALL hacer upsert en `public.user_plans` con `user_id = U`, `plan = 'pro'`, `stripe_customer_id = session.customer`, `stripe_subscription_id = session.subscription` y `updated_at = now()`, usando el cliente service-role (bypass de RLS)

#### Scenario: Idempotencia ante reentregas
- **WHEN** Stripe reentrega el mismo `checkout.session.completed`
- **THEN** el upsert keyed en `user_id` SHALL converger al mismo estado sin crear filas duplicadas ni fallar

#### Scenario: Evento no manejado
- **WHEN** se recibe un evento verificado de un tipo distinto a `checkout.session.completed`
- **THEN** el sistema SHALL responder HTTP 200 sin realizar cambios

### Requirement: Modal de upgrade ante límite alcanzado
El sistema SHALL mostrar un modal de upgrade en la UI del analizador cuando la API responda HTTP 402.

#### Scenario: La API responde 402
- **WHEN** la UI del analizador recibe HTTP 402 desde `POST /api/analyze-feedback`
- **THEN** el sistema SHALL mostrar un modal que explica el límite gratuito de 5 análisis/mes y ofrece un botón que llama a `POST /api/checkout` y redirige a la URL devuelta

#### Scenario: Análisis exitoso no muestra modal
- **WHEN** la UI recibe HTTP 200 de `POST /api/analyze-feedback`
- **THEN** el sistema SHALL renderizar los resultados normalmente sin mostrar el modal de upgrade
