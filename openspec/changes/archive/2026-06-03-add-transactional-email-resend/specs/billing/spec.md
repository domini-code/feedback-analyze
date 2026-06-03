## MODIFIED Requirements

### Requirement: Webhook de Stripe verifica firma y activa el plan Pro
El sistema SHALL exponer `POST /api/webhooks/stripe` que verifica la firma del evento y, en `checkout.session.completed`, establece el plan del usuario en `pro`. Tras persistir el cambio de plan, el sistema SHALL también enviar un email de confirmación de activación Pro al usuario.

#### Scenario: Verificación de firma sobre el cuerpo crudo
- **WHEN** llega una request a `POST /api/webhooks/stripe`
- **THEN** el sistema SHALL leer el cuerpo como bytes sin parsear y verificar la firma con `STRIPE_WEBHOOK_SECRET`; si la verificación falla SHALL responder HTTP 400 sin procesar el evento

#### Scenario: checkout.session.completed activa el plan Pro y envía email
- **WHEN** el evento verificado es `checkout.session.completed` y contiene `metadata.supabase_user_id`
- **THEN** el sistema SHALL hacer upsert en `user_plans` con `plan = 'pro'` y los identificadores de Stripe (`stripe_customer_id`, `stripe_subscription_id`), responder HTTP 200, y SHALL invocar `sendProActivationEmail(userEmail)` de forma no bloqueante — un fallo en el envío del email NOT SHALL cambiar la respuesta HTTP 200 ni revertir el cambio de plan

#### Scenario: Obtención del email del usuario para el email de activación
- **WHEN** el webhook procesa un `checkout.session.completed` para activar el plan Pro
- **THEN** el sistema SHALL obtener el email del usuario desde `auth.users` usando el `supabase_user_id` del metadata del evento y el cliente service-role antes de invocar `sendProActivationEmail`; si el email no puede obtenerse SHALL omitir el envío del email y registrar un `warn` sin fallar

#### Scenario: Evento desconocido ignorado
- **WHEN** el evento verificado no es `checkout.session.completed`
- **THEN** el sistema SHALL responder HTTP 200 sin realizar ninguna acción en base de datos ni enviar email
