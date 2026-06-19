-- Calls table for storing call metadata
CREATE TABLE IF NOT EXISTS public.calls (
  id TEXT PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  caller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video')),
  status TEXT NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'accepted', 'rejected', 'ended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Call signaling table for WebRTC signaling (offer, answer, ICE candidates)
CREATE TABLE IF NOT EXISTS public.call_signals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id TEXT NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice_candidate')),
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_calls_conversation_id ON public.calls(conversation_id);
CREATE INDEX idx_calls_caller_id ON public.calls(caller_id);
CREATE INDEX idx_calls_recipient_id ON public.calls(recipient_id);
CREATE INDEX idx_calls_status ON public.calls(status);
CREATE INDEX idx_call_signals_call_id ON public.call_signals(call_id);
CREATE INDEX idx_call_signals_from_user_id ON public.call_signals(from_user_id);
CREATE INDEX idx_call_signals_to_user_id ON public.call_signals(to_user_id);

-- RLS Policies
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- Calls RLS: Users can see calls they're involved in
CREATE POLICY "Users can view calls they are involved in" ON public.calls
  FOR SELECT USING (
    auth.uid() = caller_id OR auth.uid() = recipient_id
  );

CREATE POLICY "Users can create calls" ON public.calls
  FOR INSERT WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Users can update own calls" ON public.calls
  FOR UPDATE USING (auth.uid() = caller_id OR auth.uid() = recipient_id);

-- Call signals RLS: Users can see signals addressed to them or sent by them
CREATE POLICY "Users can view call signals" ON public.call_signals
  FOR SELECT USING (
    auth.uid() = from_user_id OR auth.uid() = to_user_id
  );

CREATE POLICY "Users can insert call signals" ON public.call_signals
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);
