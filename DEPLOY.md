# DEPLOY — Boletera EcoEventos

## Variables de entorno (llenar antes de deploy)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

NEXT_PUBLIC_APP_URL=https://tienda.urbanika.xyz
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@urbanika.xyz
```

## Pasos de deploy

### 1. Supabase
1. Crear proyecto en supabase.com
2. Copiar URL + anon key + service role key
3. Ir a SQL Editor → ejecutar `supabase/migrations/001_initial_schema.sql`
4. Ejecutar `supabase/migrations/002_functions.sql`
5. Auth → Settings → Email → cambiar tipo a "OTP" (6 dígitos)
6. Auth → Settings → SMTP → configurar dominio propio (Resend o Postmark)

### 2. Stripe
1. Dashboard → API Keys → copiar keys
2. Connect → configurar cuenta de plataforma
3. Webhook endpoint: `https://tienda.urbanika.xyz/api/webhook`
   - Eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copiar webhook secret

### 3. Vercel
1. Conectar repo GitHub → Vercel
2. Framework: Next.js (auto-detectado)
3. Agregar variables de entorno (todas las de arriba)
4. Custom domain: `tienda.urbanika.xyz`
5. Deploy

### 4. Verificación post-deploy
- [ ] Home carga eventos (con Supabase conectado)
- [ ] Login OTP funciona (envía correo)
- [ ] Checkout crea PaymentIntent en Stripe
- [ ] Webhook recibe eventos de Stripe
- [ ] Admin puede aprobar/rechazar eventos
- [ ] Buyer ve sus tickets
