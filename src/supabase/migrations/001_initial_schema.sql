-- ============================================================
-- Scout Connect — Supabase PostgreSQL Migration
-- Run this in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- USERS (extends Supabase auth.users)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email            TEXT,
  full_name        TEXT,
  role             TEXT NOT NULL DEFAULT 'user',
  avatar           TEXT,
  bio              TEXT,
  location         TEXT,
  rank             TEXT,
  xp               INTEGER DEFAULT 0,
  scout_id         TEXT,
  theme            TEXT DEFAULT 'light',
  onboarding_complete BOOLEAN DEFAULT FALSE,
  unit_name        TEXT,
  clan_name        TEXT,
  last_login       TIMESTAMPTZ,
  created_date     TIMESTAMPTZ DEFAULT NOW(),
  updated_date     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_select_own"   ON public.users FOR SELECT  USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "users_update_own"   ON public.users FOR UPDATE  USING (auth.uid() = id);
CREATE POLICY "users_insert_own"   ON public.users FOR INSERT  WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- POSTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id      TEXT NOT NULL,
  author_name    TEXT,
  author_avatar  TEXT,
  content        TEXT,
  media_urls     JSONB DEFAULT '[]',
  media_type     TEXT CHECK (media_type IN ('image','video','multiple')),
  location       TEXT,
  hashtags       JSONB DEFAULT '[]',
  likes          JSONB DEFAULT '[]',
  likes_count    INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count   INTEGER DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  visibility     TEXT NOT NULL DEFAULT 'public' CHECK (visibility IN ('public','followers','private')),
  is_unit_post   BOOLEAN DEFAULT FALSE,
  unit_id        UUID,
  clan_id        UUID,
  work_category  TEXT DEFAULT 'none',
  points_awarded INTEGER DEFAULT 0,
  music_title    TEXT,
  music_artist   TEXT,
  music_url      TEXT,
  music_source   TEXT DEFAULT 'none',
  created_by_id  UUID REFERENCES auth.users(id),
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_posts_status       ON public.posts(status);
CREATE INDEX idx_posts_author_id    ON public.posts(author_id);
CREATE INDEX idx_posts_created_date ON public.posts(created_date DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select_public"  ON public.posts FOR SELECT  USING (status = 'approved' OR created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "posts_insert_auth"    ON public.posts FOR INSERT  WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "posts_update_own"     ON public.posts FOR UPDATE  USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "posts_delete_own"     ON public.posts FOR DELETE  USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─────────────────────────────────────────────────────────────
-- STORIES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.stories (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id      TEXT NOT NULL,
  author_name    TEXT,
  author_avatar  TEXT,
  media_url      TEXT NOT NULL,
  media_type     TEXT CHECK (media_type IN ('image','video')),
  expires_at     TIMESTAMPTZ,
  viewers        JSONB DEFAULT '[]',
  is_highlight   BOOLEAN DEFAULT FALSE,
  highlight_name TEXT,
  text_overlay   TEXT,
  text_position  TEXT DEFAULT 'center',
  text_color     TEXT DEFAULT '#ffffff',
  filter         TEXT,
  music_title    TEXT,
  music_artist   TEXT,
  music_url      TEXT,
  music_source   TEXT DEFAULT 'none',
  created_by_id  UUID REFERENCES auth.users(id),
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (TRUE);
CREATE POLICY "stories_insert" ON public.stories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "stories_update" ON public.stories FOR UPDATE USING (created_by_id = auth.uid());
CREATE POLICY "stories_delete" ON public.stories FOR DELETE USING (created_by_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id       UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id     TEXT NOT NULL,
  author_name   TEXT,
  author_avatar TEXT,
  content       TEXT NOT NULL,
  likes         JSONB DEFAULT '[]',
  parent_id     UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_post_id ON public.comments(post_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE USING (created_by_id = auth.uid());
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (created_by_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.follows (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id    TEXT NOT NULL,
  following_id   TEXT NOT NULL,
  follower_name  TEXT,
  following_name TEXT,
  created_by_id  UUID REFERENCES auth.users(id),
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

CREATE INDEX idx_follows_follower  ON public.follows(follower_id);
CREATE INDEX idx_follows_following ON public.follows(following_id);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (TRUE);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (created_by_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        TEXT NOT NULL,
  type           TEXT NOT NULL,
  title          TEXT,
  message        TEXT NOT NULL,
  actor_id       TEXT,
  actor_name     TEXT,
  actor_avatar   TEXT,
  reference_id   TEXT,
  reference_type TEXT,
  is_read        BOOLEAN DEFAULT FALSE,
  created_by_id  UUID REFERENCES auth.users(id),
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid()::TEXT);
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (user_id = auth.uid()::TEXT);

-- ─────────────────────────────────────────────────────────────
-- CONVERSATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversations (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type                TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct','group')),
  participants        JSONB DEFAULT '[]',
  participant_details JSONB DEFAULT '[]',
  group_name          TEXT,
  group_avatar        TEXT,
  group_description   TEXT,
  admins              JSONB DEFAULT '[]',
  last_message        TEXT,
  last_message_at     TIMESTAMPTZ,
  last_sender_id      TEXT,
  pinned_messages     JSONB DEFAULT '[]',
  unread_count        JSONB DEFAULT '{}',
  typing_users        JSONB DEFAULT '{}',
  created_by_id       UUID REFERENCES auth.users(id),
  created_date        TIMESTAMPTZ DEFAULT NOW(),
  updated_date        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (participants::TEXT LIKE ('%' || auth.uid()::TEXT || '%') OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (participants::TEXT LIKE ('%' || auth.uid()::TEXT || '%'));

-- ─────────────────────────────────────────────────────────────
-- MESSAGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       TEXT NOT NULL,
  sender_name     TEXT,
  sender_avatar   TEXT,
  content         TEXT,
  media_url       TEXT,
  media_type      TEXT CHECK (media_type IN ('text','image','video','voice','file')),
  reply_to        UUID REFERENCES public.messages(id),
  reply_preview   TEXT,
  reactions       JSONB DEFAULT '[]',
  read_by         JSONB DEFAULT '[]',
  delivered_to    JSONB DEFAULT '[]',
  deleted_for     JSONB DEFAULT '[]',
  is_deleted      BOOLEAN DEFAULT FALSE,
  created_by_id   UUID REFERENCES auth.users(id),
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created      ON public.messages(created_date DESC);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.participants::TEXT LIKE ('%' || auth.uid()::TEXT || '%')));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (created_by_id = auth.uid());
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (created_by_id = auth.uid());

-- ─────────────────────────────────────────────────────────────
-- CLANS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clans (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name             TEXT NOT NULL,
  description      TEXT,
  avatar           TEXT,
  cover_image      TEXT,
  admin_id         TEXT,
  admin_email      TEXT,
  leaders          JSONB DEFAULT '[]',
  members          JSONB DEFAULT '[]',
  member_count     INTEGER DEFAULT 0,
  location         TEXT,
  founded_date     DATE,
  conversation_id  UUID,
  achievements     JSONB DEFAULT '[]',
  points           INTEGER DEFAULT 0,
  status           TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  created_by_id    UUID REFERENCES auth.users(id),
  created_date     TIMESTAMPTZ DEFAULT NOW(),
  updated_date     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clans_select" ON public.clans FOR SELECT USING (TRUE);
CREATE POLICY "clans_insert" ON public.clans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clans_update" ON public.clans FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─────────────────────────────────────────────────────────────
-- UNITS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.units (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  description     TEXT,
  avatar          TEXT,
  cover_image     TEXT,
  admin_id        TEXT,
  admin_email     TEXT,
  members         JSONB DEFAULT '[]',
  member_count    INTEGER DEFAULT 0,
  location        TEXT,
  founded_date    DATE,
  points          INTEGER DEFAULT 0,
  conversation_id UUID,
  status          TEXT DEFAULT 'active' CHECK (status IN ('active','inactive','pending')),
  created_by_id   UUID REFERENCES auth.users(id),
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units_select" ON public.units FOR SELECT USING (TRUE);
CREATE POLICY "units_insert" ON public.units FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "units_update" ON public.units FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─────────────────────────────────────────────────────────────
-- PATROLS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.patrols (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                 TEXT NOT NULL,
  slogan               TEXT,
  avatar               TEXT,
  clan_id              UUID REFERENCES public.clans(id),
  leader_id            TEXT,
  assistant_leader_id  TEXT,
  members              JSONB DEFAULT '[]',
  member_count         INTEGER DEFAULT 0,
  conversation_id      UUID,
  points               INTEGER DEFAULT 0,
  badges               JSONB DEFAULT '[]',
  created_by_id        UUID REFERENCES auth.users(id),
  created_date         TIMESTAMPTZ DEFAULT NOW(),
  updated_date         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.patrols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patrols_select" ON public.patrols FOR SELECT USING (TRUE);
CREATE POLICY "patrols_insert" ON public.patrols FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "patrols_update" ON public.patrols FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─────────────────────────────────────────────────────────────
-- BADGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.badges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  description  TEXT,
  icon         TEXT,
  category     TEXT CHECK (category IN ('outdoor','service','skills','leadership','special','achievement')),
  requirements JSONB DEFAULT '[]',
  points       INTEGER DEFAULT 10,
  level        TEXT CHECK (level IN ('bronze','silver','gold','platinum')),
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select" ON public.badges FOR SELECT USING (TRUE);
CREATE POLICY "badges_insert" ON public.badges FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "badges_update" ON public.badges FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- USER BADGES
CREATE TABLE IF NOT EXISTS public.user_badges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      TEXT NOT NULL,
  badge_id     UUID REFERENCES public.badges(id),
  badge_name   TEXT,
  badge_icon   TEXT,
  earned_date  DATE,
  progress     INTEGER DEFAULT 0,
  status       TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress','pending_approval','earned')),
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_select" ON public.user_badges FOR SELECT USING (TRUE);
CREATE POLICY "user_badges_insert" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "user_badges_update" ON public.user_badges FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- BADGE REQUESTS
CREATE TABLE IF NOT EXISTS public.badge_requests (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id   TEXT NOT NULL,
  requester_name TEXT,
  badge_id       UUID REFERENCES public.badges(id),
  badge_name     TEXT,
  request_type   TEXT DEFAULT 'personal' CHECK (request_type IN ('personal','unit','clan')),
  target_id      TEXT,
  target_name    TEXT,
  reason         TEXT,
  evidence_urls  JSONB DEFAULT '[]',
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes    TEXT,
  created_by_id  UUID REFERENCES auth.users(id),
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.badge_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_requests_select" ON public.badge_requests FOR SELECT USING (requester_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "badge_requests_insert" ON public.badge_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "badge_requests_update" ON public.badge_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─────────────────────────────────────────────────────────────
-- EVENTS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.events (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                TEXT NOT NULL,
  description          TEXT,
  cover_image          TEXT,
  location             TEXT,
  location_coordinates JSONB,
  start_date           TIMESTAMPTZ NOT NULL,
  end_date             TIMESTAMPTZ,
  organizer_id         TEXT,
  organizer_name       TEXT,
  clan_id              UUID REFERENCES public.clans(id),
  participants         JSONB DEFAULT '[]',
  participant_count    INTEGER DEFAULT 0,
  max_participants     INTEGER,
  conversation_id      UUID,
  status               TEXT DEFAULT 'pending' CHECK (status IN ('draft','pending','approved','ongoing','completed','cancelled')),
  event_type           TEXT CHECK (event_type IN ('camping','hike','service','training','ceremony','meeting','other')),
  created_by_id        UUID REFERENCES auth.users(id),
  created_date         TIMESTAMPTZ DEFAULT NOW(),
  updated_date         TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_start_date ON public.events(start_date);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select" ON public.events FOR SELECT USING (TRUE);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.registrations (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id             UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id              TEXT NOT NULL,
  user_name            TEXT,
  registration_type    TEXT DEFAULT 'individual',
  team_members         JSONB DEFAULT '[]',
  unit_id              UUID,
  transport_needed     BOOLEAN DEFAULT FALSE,
  special_requirements TEXT,
  status               TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled')),
  payment_status       TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','waived')),
  created_by_id        UUID REFERENCES auth.users(id),
  created_date         TIMESTAMPTZ DEFAULT NOW(),
  updated_date         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registrations_select" ON public.registrations FOR SELECT USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "registrations_insert" ON public.registrations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "registrations_update" ON public.registrations FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─────────────────────────────────────────────────────────────
-- COURSES, LESSONS, QUIZZES, PROGRESS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.courses (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title             TEXT NOT NULL,
  description       TEXT,
  category          TEXT,
  cover_image       TEXT,
  difficulty        TEXT CHECK (difficulty IN ('beginner','intermediate','advanced')),
  duration_minutes  INTEGER,
  xp_reward         INTEGER DEFAULT 100,
  badge_id          UUID REFERENCES public.badges(id),
  lessons_count     INTEGER DEFAULT 0,
  enrollments_count INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'published' CHECK (status IN ('draft','published','archived')),
  created_by_id     UUID REFERENCES auth.users(id),
  created_date      TIMESTAMPTZ DEFAULT NOW(),
  updated_date      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (TRUE);
CREATE POLICY "courses_insert" ON public.courses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "courses_update" ON public.courses FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.lessons (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id        UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  content          TEXT,
  video_url        TEXT,
  pdf_url          TEXT,
  "order"          INTEGER,
  duration_minutes INTEGER,
  xp_reward        INTEGER DEFAULT 20,
  tasks            JSONB DEFAULT '[]',
  created_by_id    UUID REFERENCES auth.users(id),
  created_date     TIMESTAMPTZ DEFAULT NOW(),
  updated_date     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_select" ON public.lessons FOR SELECT USING (TRUE);
CREATE POLICY "lessons_insert" ON public.lessons FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "lessons_update" ON public.lessons FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.quizzes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id     UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id     UUID REFERENCES public.lessons(id),
  title         TEXT NOT NULL,
  questions     JSONB DEFAULT '[]',
  passing_score INTEGER DEFAULT 70,
  xp_reward     INTEGER DEFAULT 50,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (TRUE);
CREATE POLICY "quizzes_insert" ON public.quizzes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.scout_progress (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           TEXT NOT NULL,
  course_id         UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_lessons JSONB DEFAULT '[]',
  quiz_scores       JSONB DEFAULT '[]',
  progress_percent  INTEGER DEFAULT 0,
  xp_earned         INTEGER DEFAULT 0,
  status            TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled','in_progress','completed','badge_pending','badge_earned')),
  completed_at      TIMESTAMPTZ,
  created_by_id     UUID REFERENCES auth.users(id),
  created_date      TIMESTAMPTZ DEFAULT NOW(),
  updated_date      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.scout_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scout_progress_select" ON public.scout_progress FOR SELECT USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "scout_progress_insert" ON public.scout_progress FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "scout_progress_update" ON public.scout_progress FOR UPDATE USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─────────────────────────────────────────────────────────────
-- MARKETPLACE (Products, Orders, Rentals, Donations, DIY)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.products (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT,
  description   TEXT,
  price         NUMERIC(10,2),
  images        JSONB DEFAULT '[]',
  category      TEXT,
  condition     TEXT,
  seller_id     TEXT,
  seller_name   TEXT,
  status        TEXT DEFAULT 'active',
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON public.products FOR SELECT USING (TRUE);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (created_by_id = auth.uid());
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (created_by_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.orders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id     UUID REFERENCES public.products(id),
  buyer_id       TEXT,
  buyer_name     TEXT,
  quantity       INTEGER DEFAULT 1,
  total_amount   NUMERIC(10,2),
  status         TEXT DEFAULT 'pending',
  created_by_id  UUID REFERENCES auth.users(id),
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (buyer_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.rental_listings (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  description   TEXT,
  price_per_day NUMERIC(10,2),
  images        JSONB DEFAULT '[]',
  category      TEXT,
  owner_id      TEXT,
  owner_name    TEXT,
  status        TEXT DEFAULT 'available',
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.rental_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rental_listings_select" ON public.rental_listings FOR SELECT USING (TRUE);
CREATE POLICY "rental_listings_insert" ON public.rental_listings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rental_listings_update" ON public.rental_listings FOR UPDATE USING (created_by_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.donations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  description   TEXT,
  images        JSONB DEFAULT '[]',
  donor_id      TEXT,
  donor_name    TEXT,
  status        TEXT DEFAULT 'available',
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select" ON public.donations FOR SELECT USING (TRUE);
CREATE POLICY "donations_insert" ON public.donations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.diy_tutorials (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  description   TEXT,
  images        JSONB DEFAULT '[]',
  steps         JSONB DEFAULT '[]',
  category      TEXT,
  author_id     TEXT,
  author_name   TEXT,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.diy_tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diy_tutorials_select" ON public.diy_tutorials FOR SELECT USING (TRUE);
CREATE POLICY "diy_tutorials_insert" ON public.diy_tutorials FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- MISC TABLES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       TEXT NOT NULL UNIQUE,
  username      TEXT,
  full_name     TEXT,
  avatar        TEXT,
  bio           TEXT,
  rank          TEXT,
  xp            INTEGER DEFAULT 0,
  scout_id      TEXT,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count   INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_profiles_select" ON public.public_profiles FOR SELECT USING (TRUE);
CREATE POLICY "public_profiles_insert" ON public.public_profiles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "public_profiles_update" ON public.public_profiles FOR UPDATE USING (user_id = auth.uid()::TEXT);

CREATE TABLE IF NOT EXISTS public.music (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  artist        TEXT,
  url           TEXT,
  source        TEXT DEFAULT 'none',
  cover         TEXT,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.music ENABLE ROW LEVEL SECURITY;
CREATE POLICY "music_select" ON public.music FOR SELECT USING (TRUE);
CREATE POLICY "music_insert" ON public.music FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.join_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id    TEXT NOT NULL,
  requester_name  TEXT,
  target_type     TEXT CHECK (target_type IN ('unit','clan')),
  target_id       TEXT,
  target_name     TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_by_id   UUID REFERENCES auth.users(id),
  created_date    TIMESTAMPTZ DEFAULT NOW(),
  updated_date    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "join_requests_select" ON public.join_requests FOR SELECT USING (requester_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "join_requests_insert" ON public.join_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "join_requests_update" ON public.join_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.revenue_payments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       TEXT,
  amount        NUMERIC(10,2),
  currency      TEXT DEFAULT 'RWF',
  method        TEXT,
  status        TEXT DEFAULT 'pending',
  reference     TEXT,
  notes         TEXT,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.revenue_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenue_payments_select" ON public.revenue_payments FOR SELECT USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "revenue_payments_insert" ON public.revenue_payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        TEXT NOT NULL,
  plan           TEXT,
  status         TEXT DEFAULT 'active',
  starts_at      TIMESTAMPTZ,
  ends_at        TIMESTAMPTZ,
  created_by_id  UUID REFERENCES auth.users(id),
  created_date   TIMESTAMPTZ DEFAULT NOW(),
  updated_date   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.locations (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL,
  type          TEXT,
  description   TEXT,
  address       TEXT,
  latitude      NUMERIC(10,6),
  longitude     NUMERIC(10,6),
  images        JSONB DEFAULT '[]',
  amenities     JSONB DEFAULT '[]',
  capacity      INTEGER,
  contact_info  TEXT,
  status        TEXT DEFAULT 'active',
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_select" ON public.locations FOR SELECT USING (TRUE);
CREATE POLICY "locations_insert" ON public.locations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.transport_groups (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id      UUID REFERENCES public.events(id),
  driver_id     TEXT,
  driver_name   TEXT,
  seats         INTEGER,
  passengers    JSONB DEFAULT '[]',
  departure_point TEXT,
  status        TEXT DEFAULT 'open',
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transport_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_groups_select" ON public.transport_groups FOR SELECT USING (TRUE);
CREATE POLICY "transport_groups_insert" ON public.transport_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "transport_groups_update" ON public.transport_groups FOR UPDATE USING (created_by_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.meeting_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  description   TEXT,
  unit_id       UUID,
  scheduled_at  TIMESTAMPTZ,
  agenda        JSONB DEFAULT '[]',
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.meeting_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_plans_select" ON public.meeting_plans FOR SELECT USING (TRUE);
CREATE POLICY "meeting_plans_insert" ON public.meeting_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.games (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  description   TEXT,
  category      TEXT,
  instructions  TEXT,
  min_players   INTEGER,
  max_players   INTEGER,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_select" ON public.games FOR SELECT USING (TRUE);
CREATE POLICY "games_insert" ON public.games FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.camp_plans (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  description   TEXT,
  layout        JSONB DEFAULT '{}',
  unit_id       UUID,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.camp_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camp_plans_select" ON public.camp_plans FOR SELECT USING (TRUE);
CREATE POLICY "camp_plans_insert" ON public.camp_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.printable_templates (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  description   TEXT,
  file_url      TEXT,
  category      TEXT,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.printable_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "printable_templates_select" ON public.printable_templates FOR SELECT USING (TRUE);
CREATE POLICY "printable_templates_insert" ON public.printable_templates FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.training_videos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT,
  description   TEXT,
  url           TEXT,
  category      TEXT,
  duration      INTEGER,
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_videos_select" ON public.training_videos FOR SELECT USING (TRUE);
CREATE POLICY "training_videos_insert" ON public.training_videos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.competition_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT,
  year          INTEGER,
  winner_id     UUID,
  winner_name   TEXT,
  results       JSONB DEFAULT '[]',
  created_by_id UUID REFERENCES auth.users(id),
  created_date  TIMESTAMPTZ DEFAULT NOW(),
  updated_date  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.competition_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competition_history_select" ON public.competition_history FOR SELECT USING (TRUE);
CREATE POLICY "competition_history_insert" ON public.competition_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- ─────────────────────────────────────────────────────────────
-- STORAGE BUCKETS (run separately in Dashboard → Storage)
-- ─────────────────────────────────────────────────────────────
-- INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media',   'media',   true) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('documents','documents',false) ON CONFLICT DO NOTHING;
-- INSERT INTO storage.buckets (id, name, public) VALUES ('audio',   'audio',   true) ON CONFLICT DO NOTHING;

-- Storage policies (run after creating buckets):
-- CREATE POLICY "avatars_public_read"   ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
-- CREATE POLICY "avatars_auth_upload"   ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "media_public_read"     ON storage.objects FOR SELECT USING (bucket_id = 'media');
-- CREATE POLICY "media_auth_upload"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "audio_public_read"     ON storage.objects FOR SELECT USING (bucket_id = 'audio');
-- CREATE POLICY "audio_auth_upload"     ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'audio' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "documents_auth_read"   ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.uid() IS NOT NULL);
-- CREATE POLICY "documents_auth_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────────────────────
-- Enable Realtime for key tables
-- ─────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;