
CREATE TABLE public.character_status_effects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  effect_name TEXT NOT NULL,
  effect_type TEXT NOT NULL DEFAULT 'debuff',
  icon TEXT NOT NULL DEFAULT '⚡',
  duration_turns INTEGER NOT NULL DEFAULT 3,
  turns_remaining INTEGER NOT NULL DEFAULT 3,
  stat_modifier JSONB DEFAULT '{}'::jsonb,
  damage_per_turn INTEGER DEFAULT 0,
  heal_per_turn INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.character_status_effects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own status effects" ON public.character_status_effects
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_status_effects.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own status effects" ON public.character_status_effects
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_status_effects.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own status effects" ON public.character_status_effects
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_status_effects.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own status effects" ON public.character_status_effects
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_status_effects.character_id AND characters.user_id = auth.uid()));
