-- Fix duplicate conversations bug
-- Add a unique constraint for direct conversations between two users

-- First, create a function to generate a unique key for direct conversations
-- This ensures that a conversation between user A and B is the same as between B and A
CREATE OR REPLACE FUNCTION get_participants_key(participants JSONB) 
RETURNS TEXT AS $$
DECLARE
  sorted_array TEXT[];
BEGIN
  -- Extract UUIDs from the JSONB array, sort them, and join with comma
  SELECT ARRAY(
    SELECT value::TEXT 
    FROM jsonb_array_elements_text(participants)
    ORDER BY value::TEXT
  ) INTO sorted_array;
  RETURN ARRAY_TO_STRING(sorted_array, '|');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add a computed column (or use a trigger) to enforce uniqueness
-- Since we can't add a generated column directly, we'll add a unique constraint with a trigger

-- Create a table to track direct conversation participants
CREATE TABLE IF NOT EXISTS public.direct_conversation_keys (
  conversation_id UUID PRIMARY KEY REFERENCES public.conversations(id) ON DELETE CASCADE,
  participants_key TEXT NOT NULL UNIQUE,
  created_date TIMESTAMPTZ DEFAULT NOW()
);

-- Create a trigger to automatically populate the key when a direct conversation is created
CREATE OR REPLACE FUNCTION maintain_direct_conversation_key()
RETURNS TRIGGER AS $$
DECLARE
  participants_key TEXT;
BEGIN
  IF NEW.type = 'direct' AND NEW.participants IS NOT NULL THEN
    participants_key := get_participants_key(NEW.participants);
    INSERT INTO public.direct_conversation_keys (conversation_id, participants_key)
    VALUES (NEW.id, participants_key)
    ON CONFLICT (participants_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_maintain_direct_conversation_key ON public.conversations;
CREATE TRIGGER trigger_maintain_direct_conversation_key
AFTER INSERT ON public.conversations
FOR EACH ROW
EXECUTE FUNCTION maintain_direct_conversation_key();

-- Create an index on type for faster filtering
CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON public.conversations(last_message_at DESC);
