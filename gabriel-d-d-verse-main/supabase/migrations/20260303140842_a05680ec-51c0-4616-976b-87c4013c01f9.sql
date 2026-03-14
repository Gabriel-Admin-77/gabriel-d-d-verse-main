
-- Characters table
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  class TEXT NOT NULL,
  level INTEGER NOT NULL DEFAULT 1,
  hp_current INTEGER NOT NULL,
  hp_max INTEGER NOT NULL,
  ac INTEGER NOT NULL,
  str INTEGER NOT NULL DEFAULT 10,
  dex INTEGER NOT NULL DEFAULT 10,
  con INTEGER NOT NULL DEFAULT 10,
  int INTEGER NOT NULL DEFAULT 10,
  wis INTEGER NOT NULL DEFAULT 10,
  cha INTEGER NOT NULL DEFAULT 10,
  moral_score INTEGER NOT NULL DEFAULT 50,
  gold INTEGER NOT NULL DEFAULT 50,
  silver INTEGER NOT NULL DEFAULT 0,
  copper INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own characters" ON public.characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own characters" ON public.characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters" ON public.characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters" ON public.characters FOR DELETE USING (auth.uid() = user_id);

-- Character inventory
CREATE TABLE public.character_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_icon TEXT NOT NULL DEFAULT '📦',
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.character_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own inventory" ON public.character_inventory FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.characters WHERE characters.id = character_inventory.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can manage own inventory" ON public.character_inventory FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.characters WHERE characters.id = character_inventory.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can update own inventory" ON public.character_inventory FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.characters WHERE characters.id = character_inventory.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can delete own inventory" ON public.character_inventory FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.characters WHERE characters.id = character_inventory.character_id AND characters.user_id = auth.uid()));

-- Moral choices log
CREATE TABLE public.moral_choices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  dilemma_id TEXT NOT NULL,
  dilemma_title TEXT NOT NULL,
  choice_made TEXT NOT NULL,
  moral_shift INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.moral_choices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own moral choices" ON public.moral_choices FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.characters WHERE characters.id = moral_choices.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can insert own moral choices" ON public.moral_choices FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.characters WHERE characters.id = moral_choices.character_id AND characters.user_id = auth.uid()));

-- Chat history
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('dm', 'player')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat" ON public.chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.characters WHERE characters.id = chat_messages.character_id AND characters.user_id = auth.uid()));
CREATE POLICY "Users can insert own chat" ON public.chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.characters WHERE characters.id = chat_messages.character_id AND characters.user_id = auth.uid()));

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON public.characters
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
