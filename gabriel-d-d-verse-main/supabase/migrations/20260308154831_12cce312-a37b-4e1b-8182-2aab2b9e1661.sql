-- Game sessions table
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  adventure_id TEXT NOT NULL DEFAULT 'free-roam',
  adventure_title TEXT NOT NULL DEFAULT 'Free Roam',
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  max_players INTEGER NOT NULL DEFAULT 4,
  current_turn_user_id UUID REFERENCES auth.users(id),
  turn_order UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see waiting/playing sessions (public lobbies)
CREATE POLICY "Anyone can view active sessions"
ON public.game_sessions FOR SELECT
TO authenticated
USING (status IN ('waiting', 'playing'));

-- Host can create
CREATE POLICY "Users can create sessions"
ON public.game_sessions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = host_user_id);

-- Host can update their session
CREATE POLICY "Host can update session"
ON public.game_sessions FOR UPDATE
TO authenticated
USING (auth.uid() = host_user_id);

-- Host can delete
CREATE POLICY "Host can delete session"
ON public.game_sessions FOR DELETE
TO authenticated
USING (auth.uid() = host_user_id);

-- Session players join table
CREATE TABLE public.session_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  character_class TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(session_id, user_id)
);

ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can see session players
CREATE POLICY "Anyone can view session players"
ON public.session_players FOR SELECT
TO authenticated
USING (true);

-- Users can join sessions
CREATE POLICY "Users can join sessions"
ON public.session_players FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can leave sessions
CREATE POLICY "Users can leave sessions"
ON public.session_players FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Enable realtime for multiplayer tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.session_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Add session_id to chat_messages for multiplayer
ALTER TABLE public.chat_messages ADD COLUMN session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE DEFAULT NULL;
-- Add player_name to show who said what in multiplayer
ALTER TABLE public.chat_messages ADD COLUMN player_name TEXT DEFAULT NULL;