
-- profile_slots: exactly two slots DEV and OSHU
CREATE TABLE public.profile_slots (
  slot TEXT PRIMARY KEY CHECK (slot IN ('DEV','OSHU')),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  last_visited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.profile_slots (slot) VALUES ('DEV'), ('OSHU');

ALTER TABLE public.profile_slots ENABLE ROW LEVEL SECURITY;

-- Both users (and anyone signed in) can view the two slots so the selector shows status
CREATE POLICY "Slots viewable by authenticated"
  ON public.profile_slots FOR SELECT
  TO authenticated USING (true);

-- Writes go through SECURITY DEFINER functions; no direct UPDATE/INSERT/DELETE policies.

-- study_sessions
CREATE TABLE public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  focus_mode BOOLEAN NOT NULL DEFAULT false,
  label TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_study_sessions_user_started ON public.study_sessions(user_id, started_at DESC);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

-- Co-op visibility: any signed-in user can see all sessions (only 2 users in this app)
CREATE POLICY "Sessions viewable by authenticated"
  ON public.study_sessions FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Users insert own sessions"
  ON public.study_sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own sessions"
  ON public.study_sessions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users delete own sessions"
  ON public.study_sessions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Claim a slot atomically: only if free, and the caller doesn't already hold the other slot
CREATE OR REPLACE FUNCTION public.claim_profile_slot(_slot TEXT)
RETURNS public.profile_slots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.profile_slots;
  _uid UUID := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _slot NOT IN ('DEV','OSHU') THEN
    RAISE EXCEPTION 'Invalid slot';
  END IF;

  -- If caller already owns this slot, just touch and return
  SELECT * INTO _row FROM public.profile_slots WHERE slot = _slot FOR UPDATE;

  IF _row.user_id IS NOT NULL AND _row.user_id <> _uid THEN
    RAISE EXCEPTION 'Slot already claimed';
  END IF;

  -- If caller owns the other slot, free it so they can switch
  UPDATE public.profile_slots
    SET user_id = NULL
    WHERE user_id = _uid AND slot <> _slot;

  UPDATE public.profile_slots
    SET user_id = _uid, last_visited_at = now()
    WHERE slot = _slot
    RETURNING * INTO _row;

  RETURN _row;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_profile_slot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;
  UPDATE public.profile_slots
    SET last_visited_at = now()
    WHERE user_id = auth.uid();
END;
$$;

-- Enable realtime for live co-op feel
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_slots;
