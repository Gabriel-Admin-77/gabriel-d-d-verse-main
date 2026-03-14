
CREATE TABLE public.quest_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  adventure_id TEXT NOT NULL DEFAULT 'free-roam',
  quest_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(character_id, adventure_id, quest_id)
);

ALTER TABLE public.quest_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quests" ON public.quest_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = quest_log.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own quests" ON public.quest_log
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = quest_log.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can update own quests" ON public.quest_log
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = quest_log.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own quests" ON public.quest_log
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = quest_log.character_id AND characters.user_id = auth.uid()));
