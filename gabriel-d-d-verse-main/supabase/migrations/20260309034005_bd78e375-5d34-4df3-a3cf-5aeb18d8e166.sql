
CREATE TABLE public.npc_reputation (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  npc_id text NOT NULL,
  npc_name text NOT NULL,
  reputation integer NOT NULL DEFAULT 0,
  disposition text NOT NULL DEFAULT 'neutral',
  interactions integer NOT NULL DEFAULT 1,
  last_interaction text DEFAULT '',
  first_met_at timestamptz NOT NULL DEFAULT now(),
  last_met_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(character_id, npc_id)
);

ALTER TABLE public.npc_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own npc reputation"
  ON public.npc_reputation FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = npc_reputation.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own npc reputation"
  ON public.npc_reputation FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = npc_reputation.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own npc reputation"
  ON public.npc_reputation FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = npc_reputation.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own npc reputation"
  ON public.npc_reputation FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = npc_reputation.character_id AND characters.user_id = auth.uid()));
