# Variables de Entorno — Boletera EcoEventos

## ✅ Listas (copiar tal cual)

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jctchxsyubgffdktjckc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjdGNoeHN5dWJnZmZka3RqY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NDQsImV4cCI6MjA4ODc1Mzk0NH0.8lS8doOOR1Y4PGKsajW8IT7xyqjSqBAcpyOhobE4ECg` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjdGNoeHN5dWJnZmZka3RqY2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3Nzk0NCwiZXhwIjoyMDg4NzUzOTQ0fQ.HlRg6rCIcHgVjjJC7IL2XXonh12H80Fc5KcKVNix2-Y` |
| `NEXT_PUBLIC_APP_URL` | `https://tienda.urbanika.xyz` |
| `RESEND_FROM_EMAIL` | `noreply@urbanika.xyz` |

---

## ⏳ Pendientes (necesitas obtenerlas)

| Variable | Dónde obtenerla |
|---|---|
| `STRIPE_SECRET_KEY` | [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → API keys → **Secret key** (`sk_live_...` o `sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Mismo lugar → **Publishable key** (`pk_live_...` o `pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Developers → Webhooks → crear endpoint → copiar **Signing secret** (`whsec_...`) |
| `RESEND_API_KEY` | [resend.com](https://resend.com) → API Keys → Create API Key (`re_...`) |

---

## Para Vercel — pegar variable por variable en el dashboard

```
NEXT_PUBLIC_SUPABASE_URL
https://jctchxsyubgffdktjckc.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjdGNoeHN5dWJnZmZka3RqY2tjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxNzc5NDQsImV4cCI6MjA4ODc1Mzk0NH0.8lS8doOOR1Y4PGKsajW8IT7xyqjSqBAcpyOhobE4ECg

SUPABASE_SERVICE_ROLE_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpjdGNoeHN5dWJnZmZka3RqY2tjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzE3Nzk0NCwiZXhwIjoyMDg4NzUzOTQ0fQ.HlRg6rCIcHgVjjJC7IL2XXonh12H80Fc5KcKVNix2-Y

NEXT_PUBLIC_APP_URL
https://tienda.urbanika.xyz

RESEND_FROM_EMAIL
noreply@urbanika.xyz

STRIPE_SECRET_KEY
(pendiente)

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
(pendiente)

STRIPE_WEBHOOK_SECRET
(pendiente)

RESEND_API_KEY
(pendiente)
```
