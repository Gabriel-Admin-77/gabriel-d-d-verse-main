CREATE TABLE public.save_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  adventure_id text NOT NULL,
  adventure_title text NOT NULL DEFAULT 'Free Roam',
  character_name text NOT NULL DEFAULT 'Unknown',
  slot_name text NOT NULL DEFAULT 'Save',
  message_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.save_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saves" ON public.save_slots
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = save_slots.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can create own saves" ON public.save_slots
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = save_slots.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own saves" ON public.save_slots
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = save_slots.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own saves" ON public.save_slots
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = save_slots.character_id AND characters.user_id = auth.uid()));