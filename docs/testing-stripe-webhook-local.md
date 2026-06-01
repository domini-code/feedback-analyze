# Testing Stripe webhook en local

## Requisitos

- [Stripe CLI](https://github.com/stripe/stripe-cli/releases) instalado
- Variables `STRIPE_SECRET_KEY` y `STRIPE_PRICE_ID_PRO` configuradas en `.env.local`

## Pasos

### 1. Autenticarse en Stripe CLI

```powershell
stripe login
```

### 2. Iniciar el dev server

```powershell
pnpm dev
```

### 3. En otra terminal, hacer forward del webhook

```powershell
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

El CLI imprime el signing secret local:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx
```

### 4. Copiar el secret en `.env.local`

```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx
```

Reiniciar el dev server si ya estaba corriendo.

### 5. Disparar un evento de prueba

```powershell
stripe trigger checkout.session.completed
```

Verifica en la terminal del `listen` que el handler devuelve `200 OK`.

---

## Flujo completo con pago real

1. Inicia `pnpm dev` y `stripe listen` (pasos 2 y 3)
2. Haz click en **Pasar a Pro** en la app
3. En Stripe Checkout usa la tarjeta de prueba:
   - Número: `4242 4242 4242 4242`
   - Fecha: cualquier fecha futura
   - CVC: cualquier 3 dígitos
4. Al completar, el CLI forwardea `checkout.session.completed` a tu webhook
5. Verifica en Supabase que `user_plans` tiene `plan = 'pro'` para ese usuario
