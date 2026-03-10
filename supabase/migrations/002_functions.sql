-- ================================================================
-- BOLETERA ECOEVENTOS — Funciones auxiliares
-- Migración 002
-- ================================================================

-- Decrementar disponibilidad de tickets de forma atómica
CREATE OR REPLACE FUNCTION public.decrement_ticket_availability(
  p_ticket_type_id UUID,
  p_quantity INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE public.ticket_types
  SET available = available - p_quantity
  WHERE id = p_ticket_type_id AND available >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient ticket availability for %', p_ticket_type_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decrementar disponibilidad de camps de forma atómica
CREATE OR REPLACE FUNCTION public.decrement_camp_availability(
  p_camp_id UUID,
  p_quantity INTEGER DEFAULT 1
)
RETURNS void AS $$
BEGIN
  UPDATE public.camps
  SET available = available - p_quantity
  WHERE id = p_camp_id AND available >= p_quantity;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient camp availability for %', p_camp_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para estadísticas del admin
CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total_revenue', COALESCE(SUM(o.total), 0),
    'total_orders', COUNT(DISTINCT o.id),
    'total_events', (SELECT COUNT(*) FROM public.events WHERE status = 'approved'),
    'pending_events', (SELECT COUNT(*) FROM public.events WHERE status = 'pending'),
    'total_users', (SELECT COUNT(*) FROM public.profiles)
  )
  INTO result
  FROM public.orders o
  WHERE o.status = 'paid';

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
