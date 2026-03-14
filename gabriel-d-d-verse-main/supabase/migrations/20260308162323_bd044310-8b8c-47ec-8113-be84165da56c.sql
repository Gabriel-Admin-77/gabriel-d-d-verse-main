-- Add XP columns to characters
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS xp integer NOT NULL DEFAULT 0;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS xp_to_next integer NOT NULL DEFAULT 300;

-- Character abilities table
CREATE TABLE public.character_abilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  character_id uuid NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  ability_type text NOT NULL DEFAULT 'passive',
  unlocked_at_level integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.character_abilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own abilities" ON public.character_abilities
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_abilities.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can insert own abilities" ON public.character_abilities
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_abilities.character_id AND characters.user_id = auth.uid()));

CREATE POLICY "Users can delete own abilities" ON public.character_abilities
  FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM characters WHERE characters.id = character_abilities.character_id AND characters.user_id = auth.uid()));

-- Shop items table (global, readable by all authenticated users)
CREATE TABLE public.shop_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  item_type text NOT NULL DEFAULT 'weapon',
  icon text NOT NULL DEFAULT '📦',
  price_gold integer NOT NULL DEFAULT 10,
  rarity text NOT NULL DEFAULT 'common',
  stat_bonus jsonb DEFAULT '{}',
  min_level integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view shop items" ON public.shop_items
  FOR SELECT TO authenticated
  USING (true);