
-- Bestiary: catalog of encountered monsters
CREATE TABLE public.bestiary_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  monster_id text NOT NULL,
  monster_name text NOT NULL,
  hp integer NOT NULL DEFAULT 0,
  max_hp integer NOT NULL DEFAULT 0,
  ac integer NOT NULL DEFAULT 10,
  cr text NOT NULL DEFAULT '0',
  times_encountered integer NOT NULL DEFAULT 1,
  times_defeated integer NOT NULL DEFAULT 0,
  weakness_notes text DEFAULT '',
  portrait_url text,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, monster_id)
);

ALTER TABLE public.bestiary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bestiary" ON public.bestiary_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = bestiary_entries.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can insert own bestiary" ON public.bestiary_entries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = bestiary_entries.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can update own bestiary" ON public.bestiary_entries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = bestiary_entries.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can delete own bestiary" ON public.bestiary_entries FOR DELETE
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = bestiary_entries.character_id AND characters.user_id = auth.uid()));

-- Achievements system
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  achievement_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  icon text NOT NULL DEFAULT '🏆',
  rarity text NOT NULL DEFAULT 'common',
  unlocked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, achievement_id)
);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.achievements FOR SELECT
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = achievements.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can insert own achievements" ON public.achievements FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = achievements.character_id AND characters.user_id = auth.uid()));

-- Spell book: character spell slots
CREATE TABLE public.character_spells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  spell_name text NOT NULL,
  spell_level integer NOT NULL DEFAULT 0,
  school text NOT NULL DEFAULT 'evocation',
  description text NOT NULL DEFAULT '',
  damage text DEFAULT '',
  range text DEFAULT 'Self',
  casting_time text DEFAULT '1 action',
  icon text NOT NULL DEFAULT '✨',
  uses_remaining integer NOT NULL DEFAULT 1,
  max_uses integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (character_id, spell_name)
);

ALTER TABLE public.character_spells ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own spells" ON public.character_spells FOR SELECT
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_spells.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can insert own spells" ON public.character_spells FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_spells.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can update own spells" ON public.character_spells FOR UPDATE
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_spells.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can delete own spells" ON public.character_spells FOR DELETE
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_spells.character_id AND characters.user_id = auth.uid()));
