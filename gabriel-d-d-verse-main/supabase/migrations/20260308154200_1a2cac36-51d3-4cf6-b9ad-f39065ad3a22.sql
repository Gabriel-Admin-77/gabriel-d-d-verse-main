ALTER TABLE public.chat_messages ADD COLUMN adventure_id TEXT DEFAULT NULL;

-- Update RLS: users can delete their own chat messages (for clearing history)
CREATE POLICY "Users can delete own chat"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM characters
  WHERE characters.id = chat_messages.character_id
  AND characters.user_id = auth.uid()
));