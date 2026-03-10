-- ================================================================
-- BOLETERA ECOEVENTOS — Schema inicial
-- Migración 001: Tablas base, Auth, RLS
-- URB-215 + URB-217 + URB-218
-- ================================================================

-- ================================================================
-- EXTENSIONS
-- ================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- PROFILES (linked to auth.users)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id        UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email     TEXT,
  full_name TEXT,
  phone     TEXT,
  role      TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'organizer', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on new user (OTP creates user implicitly)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'buyer')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper: get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- ================================================================
-- EVENTS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id                  UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT,
  organizer_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  start_date          TIMESTAMPTZ NOT NULL,
  end_date            TIMESTAMPTZ,
  location            TEXT,
  cover_image         TEXT,
  status              TEXT DEFAULT 'pending' CHECK (status IN ('draft','pending','approved','rejected')),
  stripe_account_id   TEXT,
  application_fee_pct NUMERIC(5,2) DEFAULT 5.00,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ================================================================
-- TICKET TYPES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.ticket_types (
  id        UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id  UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  name      TEXT NOT NULL,
  price     NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  capacity  INTEGER NOT NULL CHECK (capacity > 0),
  available INTEGER NOT NULL CHECK (available >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- CAMPS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.camps (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id         UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  price            NUMERIC(10,2) DEFAULT 0 CHECK (price >= 0),
  capacity         INTEGER NOT NULL CHECK (capacity > 0),
  available        INTEGER NOT NULL CHECK (available >= 0),
  requires_payment BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ORDERS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id                       UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id                  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  event_id                 UUID REFERENCES public.events(id) ON DELETE RESTRICT NOT NULL,
  stripe_payment_intent_id TEXT UNIQUE,
  status                   TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  total                    NUMERIC(10,2) NOT NULL CHECK (total >= 0),
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ORDER ITEMS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id       UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  ticket_type_id UUID REFERENCES public.ticket_types(id) ON DELETE RESTRICT NOT NULL,
  quantity       INTEGER NOT NULL CHECK (quantity > 0),
  unit_price     NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- CAMP REGISTRATIONS
-- ================================================================
CREATE TABLE IF NOT EXISTS public.camp_registrations (
  id       UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  camp_id  UUID REFERENCES public.camps(id) ON DELETE RESTRICT NOT NULL,
  user_id  UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status   TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- STORAGE BUCKETS
-- ================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('event-covers', 'event-covers', true,  5242880,  ARRAY['image/jpeg','image/png','image/webp']),
  ('avatars',      'avatars',      true,  2097152,  ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ================================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- ================================================================
ALTER TABLE public.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camp_registrations ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- RLS POLICIES — profiles
-- ================================================================
-- Cualquiera puede leer su propio perfil
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin puede leer todos los perfiles
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT USING (get_my_role() = 'admin');

-- Usuarios pueden actualizar su propio perfil
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin puede actualizar cualquier perfil (para cambiar roles)
CREATE POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (get_my_role() = 'admin');

-- ================================================================
-- RLS POLICIES — events
-- ================================================================
-- Público puede ver eventos aprobados
CREATE POLICY "events_select_public" ON public.events
  FOR SELECT USING (status = 'approved');

-- Organizer ve sus propios eventos (cualquier status)
CREATE POLICY "events_select_organizer" ON public.events
  FOR SELECT USING (auth.uid() = organizer_id);

-- Admin ve todos los eventos
CREATE POLICY "events_select_admin" ON public.events
  FOR SELECT USING (get_my_role() = 'admin');

-- Organizer puede crear eventos
CREATE POLICY "events_insert_organizer" ON public.events
  FOR INSERT WITH CHECK (
    auth.uid() = organizer_id AND
    get_my_role() IN ('organizer', 'admin')
  );

-- Organizer actualiza sus propios eventos (solo si draft/pending)
CREATE POLICY "events_update_organizer" ON public.events
  FOR UPDATE USING (
    auth.uid() = organizer_id AND
    status IN ('draft', 'pending')
  );

-- Admin puede aprobar/rechazar cualquier evento
CREATE POLICY "events_update_admin" ON public.events
  FOR UPDATE USING (get_my_role() = 'admin');

-- ================================================================
-- RLS POLICIES — ticket_types
-- ================================================================
-- Público puede ver ticket_types de eventos aprobados
CREATE POLICY "ticket_types_select_public" ON public.ticket_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.status = 'approved'
    )
  );

-- Organizer ve sus propios ticket_types
CREATE POLICY "ticket_types_select_organizer" ON public.ticket_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

-- Admin ve todo
CREATE POLICY "ticket_types_select_admin" ON public.ticket_types
  FOR SELECT USING (get_my_role() = 'admin');

-- Organizer puede crear/editar sus ticket_types
CREATE POLICY "ticket_types_insert_organizer" ON public.ticket_types
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    ) AND get_my_role() IN ('organizer', 'admin')
  );

CREATE POLICY "ticket_types_update_organizer" ON public.ticket_types
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

-- ================================================================
-- RLS POLICIES — camps (same pattern as ticket_types)
-- ================================================================
CREATE POLICY "camps_select_public" ON public.camps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.status = 'approved'
    )
  );

CREATE POLICY "camps_select_organizer" ON public.camps
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "camps_select_admin" ON public.camps
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "camps_insert_organizer" ON public.camps
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    ) AND get_my_role() IN ('organizer', 'admin')
  );

CREATE POLICY "camps_update_organizer" ON public.camps
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

-- ================================================================
-- RLS POLICIES — orders
-- ================================================================
-- Buyer ve sus propias órdenes
CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

-- Organizer ve órdenes de sus eventos
CREATE POLICY "orders_select_organizer" ON public.orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.organizer_id = auth.uid()
    )
  );

-- Admin ve todas las órdenes
CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT USING (get_my_role() = 'admin');

-- Cualquier usuario autenticado puede crear órdenes para sí mismo
CREATE POLICY "orders_insert_authenticated" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Solo service role puede actualizar órdenes (webhook Stripe)
-- El update desde APIs usa service role key, no necesita política aquí

-- ================================================================
-- RLS POLICIES — order_items
-- ================================================================
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "order_items_select_admin" ON public.order_items
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "order_items_insert_authenticated" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

-- ================================================================
-- RLS POLICIES — camp_registrations
-- ================================================================
CREATE POLICY "camp_reg_select_own" ON public.camp_registrations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "camp_reg_select_organizer" ON public.camp_registrations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.camps c
      JOIN public.events e ON e.id = c.event_id
      WHERE c.id = camp_id AND e.organizer_id = auth.uid()
    )
  );

CREATE POLICY "camp_reg_select_admin" ON public.camp_registrations
  FOR SELECT USING (get_my_role() = 'admin');

CREATE POLICY "camp_reg_insert_authenticated" ON public.camp_registrations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ================================================================
-- STORAGE POLICIES — event-covers bucket
-- ================================================================
CREATE POLICY "event_covers_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'event-covers');

CREATE POLICY "event_covers_organizer_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'event-covers' AND
    auth.role() = 'authenticated' AND
    get_my_role() IN ('organizer', 'admin')
  );

-- ================================================================
-- STORAGE POLICIES — avatars bucket
-- ================================================================
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_own_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- ================================================================
-- INDEXES (performance)
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_events_slug        ON public.events(slug);
CREATE INDEX IF NOT EXISTS idx_events_status      ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_organizer   ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event ON public.ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_camps_event        ON public.camps(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_user        ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_event       ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_pi          ON public.orders(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order  ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_camp_reg_user      ON public.camp_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_camp_reg_camp      ON public.camp_registrations(camp_id);
