-- ============================================================
-- Scout Connect — Supabase PostgreSQL Migration (v2)
-- Run in: Supabase Dashboard → SQL Editor → Run
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- USERS (linked to Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT, full_name TEXT, role TEXT NOT NULL DEFAULT 'user',
  avatar TEXT, bio TEXT, location TEXT, rank TEXT, xp INTEGER DEFAULT 0,
  scout_id TEXT, theme TEXT DEFAULT 'light', onboarding_complete BOOLEAN DEFAULT FALSE,
  unit_id UUID, unit_name TEXT, clan_id UUID, clan_name TEXT,
  phone TEXT, date_of_birth DATE, scout_rank TEXT,
  has_wood_badge BOOLEAN DEFAULT FALSE, wood_badge_beads INTEGER, wood_badge_status TEXT,
  is_verified BOOLEAN DEFAULT FALSE, is_org_leader BOOLEAN DEFAULT FALSE,
  org_leader_role TEXT, org_leader_position TEXT,
  privacy_settings JSONB DEFAULT '{}', notification_settings JSONB DEFAULT '{}',
  language TEXT DEFAULT 'en', cover_image TEXT, username TEXT,
  last_login TIMESTAMPTZ, created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 'user')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- POSTS
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id TEXT NOT NULL, author_name TEXT, author_avatar TEXT, content TEXT,
  media_urls JSONB DEFAULT '[]', media_type TEXT, location TEXT, hashtags JSONB DEFAULT '[]',
  likes JSONB DEFAULT '[]', likes_count INTEGER DEFAULT 0, comments_count INTEGER DEFAULT 0, shares_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending', visibility TEXT NOT NULL DEFAULT 'public',
  is_unit_post BOOLEAN DEFAULT FALSE, unit_id UUID, clan_id UUID,
  work_category TEXT DEFAULT 'none', points_awarded INTEGER DEFAULT 0,
  music_title TEXT, music_artist TEXT, music_url TEXT, music_source TEXT DEFAULT 'none',
  is_donation BOOLEAN DEFAULT FALSE,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_date DESC);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_select" ON public.posts FOR SELECT USING (status = 'approved' OR created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "posts_insert" ON public.posts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "posts_update" ON public.posts FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "posts_delete" ON public.posts FOR DELETE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- STORIES
CREATE TABLE IF NOT EXISTS public.stories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), author_id TEXT NOT NULL, author_name TEXT, author_avatar TEXT,
  media_url TEXT NOT NULL, media_type TEXT, expires_at TIMESTAMPTZ, viewers JSONB DEFAULT '[]',
  is_highlight BOOLEAN DEFAULT FALSE, highlight_name TEXT, text_overlay TEXT, text_color TEXT DEFAULT '#ffffff',
  text_position TEXT DEFAULT 'center', filter TEXT,
  music_title TEXT, music_artist TEXT, music_url TEXT, music_source TEXT DEFAULT 'none',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stories_select" ON public.stories FOR SELECT USING (TRUE);
CREATE POLICY "stories_insert" ON public.stories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "stories_update" ON public.stories FOR UPDATE USING (created_by_id = auth.uid());
CREATE POLICY "stories_delete" ON public.stories FOR DELETE USING (created_by_id = auth.uid());

-- COMMENTS
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL, author_name TEXT, author_avatar TEXT, content TEXT NOT NULL,
  likes JSONB DEFAULT '[]', parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_select" ON public.comments FOR SELECT USING (TRUE);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "comments_update" ON public.comments FOR UPDATE USING (created_by_id = auth.uid());
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (created_by_id = auth.uid());

-- FOLLOWS
CREATE TABLE IF NOT EXISTS public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), follower_id TEXT NOT NULL, following_id TEXT NOT NULL,
  follower_name TEXT, following_name TEXT, created_by_id UUID REFERENCES auth.users(id),
  created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW(), UNIQUE (follower_id, following_id)
);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows_select" ON public.follows FOR SELECT USING (TRUE);
CREATE POLICY "follows_insert" ON public.follows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "follows_delete" ON public.follows FOR DELETE USING (created_by_id = auth.uid());

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id TEXT NOT NULL, type TEXT NOT NULL,
  title TEXT, message TEXT NOT NULL, actor_id TEXT, actor_name TEXT, actor_avatar TEXT,
  reference_id TEXT, reference_type TEXT, is_read BOOLEAN DEFAULT FALSE,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL OR created_by_id IS NOT NULL);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (user_id = auth.uid()::TEXT OR created_by_id = auth.uid());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (user_id = auth.uid()::TEXT OR created_by_id = auth.uid());

-- CONVERSATIONS & MESSAGES
CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), type TEXT NOT NULL DEFAULT 'direct',
  participants JSONB DEFAULT '[]', participant_details JSONB DEFAULT '[]',
  group_name TEXT, group_avatar TEXT, group_description TEXT, admins JSONB DEFAULT '[]',
  last_message TEXT, last_message_at TIMESTAMPTZ, last_sender_id TEXT,
  pinned_messages JSONB DEFAULT '[]', unread_count JSONB DEFAULT '{}', typing_users JSONB DEFAULT '{}',
  call_signal TEXT,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (participants::TEXT LIKE ('%' || auth.uid()::TEXT || '%') OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (participants::TEXT LIKE ('%' || auth.uid()::TEXT || '%'));

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id TEXT NOT NULL, sender_name TEXT, sender_avatar TEXT, content TEXT, media_url TEXT, media_type TEXT,
  reply_to UUID REFERENCES public.messages(id), reply_preview TEXT, reactions JSONB DEFAULT '[]',
  read_by JSONB DEFAULT '[]', delivered_to JSONB DEFAULT '[]', deleted_for JSONB DEFAULT '[]', is_deleted BOOLEAN DEFAULT FALSE,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_date DESC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.participants::TEXT LIKE ('%' || auth.uid()::TEXT || '%')));
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (created_by_id = auth.uid());
CREATE POLICY "messages_delete" ON public.messages FOR DELETE USING (created_by_id = auth.uid());

-- CLANS, UNITS, PATROLS
CREATE TABLE IF NOT EXISTS public.clans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT NOT NULL, description TEXT, avatar TEXT, cover_image TEXT,
  admin_id TEXT, admin_email TEXT, leaders JSONB DEFAULT '[]', members JSONB DEFAULT '[]', member_count INTEGER DEFAULT 0,
  location TEXT, founded_date DATE, conversation_id UUID, achievements JSONB DEFAULT '[]', points INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.clans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clans_select" ON public.clans FOR SELECT USING (TRUE);
CREATE POLICY "clans_insert" ON public.clans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "clans_update" ON public.clans FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT NOT NULL, description TEXT, avatar TEXT, cover_image TEXT,
  admin_id TEXT, admin_email TEXT, members JSONB DEFAULT '[]', member_count INTEGER DEFAULT 0,
  location TEXT, founded_date DATE, points INTEGER DEFAULT 0, conversation_id UUID,
  status TEXT DEFAULT 'active', created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units_select" ON public.units FOR SELECT USING (TRUE);
CREATE POLICY "units_insert" ON public.units FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "units_update" ON public.units FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.patrols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT NOT NULL, slogan TEXT, avatar TEXT,
  clan_id UUID REFERENCES public.clans(id), leader_id TEXT, assistant_leader_id TEXT,
  members JSONB DEFAULT '[]', member_count INTEGER DEFAULT 0, conversation_id UUID, points INTEGER DEFAULT 0, badges JSONB DEFAULT '[]',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.patrols ENABLE ROW LEVEL SECURITY;
CREATE POLICY "patrols_select" ON public.patrols FOR SELECT USING (TRUE);
CREATE POLICY "patrols_insert" ON public.patrols FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "patrols_update" ON public.patrols FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- BADGES
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT NOT NULL, description TEXT, icon TEXT,
  category TEXT, requirements JSONB DEFAULT '[]', points INTEGER DEFAULT 10, level TEXT,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges_select" ON public.badges FOR SELECT USING (TRUE);
CREATE POLICY "badges_insert" ON public.badges FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "badges_update" ON public.badges FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id TEXT NOT NULL, badge_id UUID REFERENCES public.badges(id),
  badge_name TEXT, badge_icon TEXT, earned_date DATE, progress INTEGER DEFAULT 0, status TEXT DEFAULT 'in_progress',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_badges_select" ON public.user_badges FOR SELECT USING (TRUE);
CREATE POLICY "user_badges_insert" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "user_badges_update" ON public.user_badges FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.badge_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), requester_id TEXT NOT NULL, requester_name TEXT,
  badge_id UUID REFERENCES public.badges(id), badge_name TEXT, request_type TEXT DEFAULT 'personal',
  target_id TEXT, target_name TEXT, reason TEXT, evidence_urls JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending', admin_notes TEXT,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.badge_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badge_requests_select" ON public.badge_requests FOR SELECT USING (requester_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "badge_requests_insert" ON public.badge_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "badge_requests_update" ON public.badge_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- EVENTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT NOT NULL, description TEXT, cover_image TEXT,
  location TEXT, location_coordinates JSONB, start_date TIMESTAMPTZ NOT NULL, end_date TIMESTAMPTZ,
  organizer_id TEXT, organizer_name TEXT, clan_id UUID REFERENCES public.clans(id),
  participants JSONB DEFAULT '[]', participant_count INTEGER DEFAULT 0, max_participants INTEGER,
  conversation_id UUID, status TEXT DEFAULT 'pending', event_type TEXT,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_start ON public.events(start_date);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_select" ON public.events FOR SELECT USING (TRUE);
CREATE POLICY "events_insert" ON public.events FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "events_update" ON public.events FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- REGISTRATIONS
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL, user_name TEXT, registration_type TEXT DEFAULT 'individual',
  team_members JSONB DEFAULT '[]', unit_id UUID, transport_needed BOOLEAN DEFAULT FALSE,
  special_requirements TEXT, status TEXT DEFAULT 'pending', payment_status TEXT DEFAULT 'pending',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "registrations_select" ON public.registrations FOR SELECT USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "registrations_insert" ON public.registrations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "registrations_update" ON public.registrations FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- TRANSPORT
CREATE TABLE IF NOT EXISTS public.transport_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), event_id UUID REFERENCES public.events(id), driver_id TEXT, driver_name TEXT,
  seats INTEGER, passengers JSONB DEFAULT '[]', departure_point TEXT, status TEXT DEFAULT 'open',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.transport_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transport_groups_select" ON public.transport_groups FOR SELECT USING (TRUE);
CREATE POLICY "transport_groups_insert" ON public.transport_groups FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "transport_groups_update" ON public.transport_groups FOR UPDATE USING (created_by_id = auth.uid());

-- CAMP PLANS
CREATE TABLE IF NOT EXISTS public.camp_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT NOT NULL, description TEXT, organizer_id TEXT, unit_id UUID,
  camp_type TEXT DEFAULT 'scouting', start_date DATE, end_date DATE, location TEXT,
  participants_count INTEGER DEFAULT 0, camp_director TEXT, emergency_contact TEXT,
  budget JSONB DEFAULT '{}', menu JSONB DEFAULT '[]', schedule JSONB DEFAULT '[]',
  tasks JSONB DEFAULT '[]', participants JSONB DEFAULT '[]', equipment JSONB DEFAULT '[]',
  risks JSONB DEFAULT '[]', campsite_layout JSONB DEFAULT '[]', announcements JSONB DEFAULT '[]',
  weather_notes TEXT, contingency_plan TEXT, status TEXT DEFAULT 'draft',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.camp_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "camp_plans_select" ON public.camp_plans FOR SELECT USING (TRUE);
CREATE POLICY "camp_plans_insert" ON public.camp_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "camp_plans_update" ON public.camp_plans FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- COURSES & LEARNING
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT NOT NULL, description TEXT, category TEXT,
  cover_image TEXT, difficulty TEXT, duration_minutes INTEGER, xp_reward INTEGER DEFAULT 100,
  badge_id UUID REFERENCES public.badges(id), lessons_count INTEGER DEFAULT 0, enrollments_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'published', created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "courses_select" ON public.courses FOR SELECT USING (TRUE);
CREATE POLICY "courses_insert" ON public.courses FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL, content TEXT, video_url TEXT, pdf_url TEXT, "order" INTEGER,
  duration_minutes INTEGER, xp_reward INTEGER DEFAULT 20, tasks JSONB DEFAULT '[]',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons_select" ON public.lessons FOR SELECT USING (TRUE);
CREATE POLICY "lessons_insert" ON public.lessons FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), course_id UUID REFERENCES public.courses(id), lesson_id UUID REFERENCES public.lessons(id),
  title TEXT NOT NULL, questions JSONB DEFAULT '[]', passing_score INTEGER DEFAULT 70, xp_reward INTEGER DEFAULT 50,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_select" ON public.quizzes FOR SELECT USING (TRUE);
CREATE POLICY "quizzes_insert" ON public.quizzes FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.scout_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_lessons JSONB DEFAULT '[]', quiz_scores JSONB DEFAULT '[]',
  progress_percent INTEGER DEFAULT 0, xp_earned INTEGER DEFAULT 0, status TEXT DEFAULT 'enrolled', completed_at TIMESTAMPTZ,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.scout_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scout_progress_select" ON public.scout_progress FOR SELECT USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "scout_progress_insert" ON public.scout_progress FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "scout_progress_update" ON public.scout_progress FOR UPDATE USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- MARKETPLACE
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, description TEXT, price NUMERIC(10,2),
  images JSONB DEFAULT '[]', thumbnail TEXT, category TEXT, condition TEXT,
  seller_id TEXT, seller_name TEXT, location TEXT, is_donation BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending', created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON public.products FOR SELECT USING (TRUE);
CREATE POLICY "products_insert" ON public.products FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "products_update" ON public.products FOR UPDATE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "products_delete" ON public.products FOR DELETE USING (created_by_id = auth.uid() OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), product_id UUID REFERENCES public.products(id),
  buyer_id TEXT, buyer_name TEXT, quantity INTEGER DEFAULT 1, total_amount NUMERIC(10,2), status TEXT DEFAULT 'pending',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders_select" ON public.orders FOR SELECT USING (buyer_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "orders_insert" ON public.orders FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.rental_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, description TEXT, price_per_day NUMERIC(10,2), deposit NUMERIC(10,2),
  images JSONB DEFAULT '[]', category TEXT, condition TEXT, owner_id TEXT, owner_name TEXT, owner_phone TEXT,
  location TEXT, status TEXT DEFAULT 'available',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.rental_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rental_listings_select" ON public.rental_listings FOR SELECT USING (TRUE);
CREATE POLICY "rental_listings_insert" ON public.rental_listings FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "rental_listings_update" ON public.rental_listings FOR UPDATE USING (created_by_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, description TEXT, images JSONB DEFAULT '[]',
  donor_id TEXT, donor_name TEXT, status TEXT DEFAULT 'available',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "donations_select" ON public.donations FOR SELECT USING (TRUE);
CREATE POLICY "donations_insert" ON public.donations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.diy_tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, description TEXT, cover_image TEXT,
  steps JSONB DEFAULT '[]', images JSONB DEFAULT '[]', category TEXT, difficulty TEXT, estimated_cost NUMERIC(10,2),
  author_id TEXT, author_name TEXT, status TEXT DEFAULT 'published',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.diy_tutorials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "diy_tutorials_select" ON public.diy_tutorials FOR SELECT USING (TRUE);
CREATE POLICY "diy_tutorials_insert" ON public.diy_tutorials FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- MISC TABLES
CREATE TABLE IF NOT EXISTS public.public_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id TEXT NOT NULL UNIQUE,
  username TEXT, full_name TEXT, email TEXT, avatar TEXT, bio TEXT, location TEXT, rank TEXT,
  xp INTEGER DEFAULT 0, scout_id TEXT, followers_count INTEGER DEFAULT 0, following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0, unit_name TEXT, clan_name TEXT,
  is_verified BOOLEAN DEFAULT FALSE, is_org_leader BOOLEAN DEFAULT FALSE, wood_badge_beads INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_profiles_select" ON public.public_profiles FOR SELECT USING (TRUE);
CREATE POLICY "public_profiles_insert" ON public.public_profiles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "public_profiles_update" ON public.public_profiles FOR UPDATE USING (user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.music (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, artist TEXT, audio_url TEXT, cover_image TEXT,
  genre TEXT, duration_seconds INTEGER, status TEXT DEFAULT 'active',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.music ENABLE ROW LEVEL SECURITY;
CREATE POLICY "music_select" ON public.music FOR SELECT USING (TRUE);
CREATE POLICY "music_insert" ON public.music FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.join_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), requester_id TEXT NOT NULL, requester_name TEXT, requester_avatar TEXT,
  target_type TEXT, target_id TEXT, target_name TEXT, status TEXT DEFAULT 'pending',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "join_requests_select" ON public.join_requests FOR SELECT USING (requester_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "join_requests_insert" ON public.join_requests FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "join_requests_update" ON public.join_requests FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.revenue_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT,
  full_name TEXT,
  scout_id TEXT,
  unit_name TEXT,
  year_of_payment INTEGER,
  amount_paid NUMERIC(10,2),
  currency TEXT DEFAULT 'RWF',
  payment_method TEXT,
  transaction_code TEXT,
  date_of_payment DATE,
  payment_proof_url TEXT,
  status TEXT DEFAULT 'pending',
  reference TEXT,
  notes TEXT,
  admin_comment TEXT,
  receipt_id TEXT,
  submitter_id TEXT,
  submitter_email TEXT,
  created_by_id UUID REFERENCES auth.users(id),
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.revenue_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "revenue_payments_select" ON public.revenue_payments FOR SELECT USING (submitter_id = auth.uid()::TEXT OR user_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "revenue_payments_insert" ON public.revenue_payments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "revenue_payments_update" ON public.revenue_payments FOR UPDATE USING (submitter_id = auth.uid()::TEXT OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), user_id TEXT, group_id TEXT, group_type TEXT, phase TEXT,
  plan TEXT, status TEXT DEFAULT 'pending', amount NUMERIC(10,2), payment_method TEXT,
  payer_name TEXT, payer_phone TEXT, payer_email TEXT, receipt_url TEXT, admin_notes TEXT,
  starts_at TIMESTAMPTZ, ends_at TIMESTAMPTZ,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON public.subscriptions FOR SELECT USING (user_id = auth.uid()::TEXT OR group_id IS NOT NULL OR EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));
CREATE POLICY "subscriptions_insert" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "subscriptions_update" ON public.subscriptions FOR UPDATE USING (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.meeting_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, description TEXT, unit_id UUID, age_group TEXT,
  duration_minutes INTEGER, objectives JSONB DEFAULT '[]', agenda JSONB DEFAULT '[]', pdf_url TEXT, downloads_count INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.meeting_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meeting_plans_select" ON public.meeting_plans FOR SELECT USING (TRUE);
CREATE POLICY "meeting_plans_insert" ON public.meeting_plans FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.games (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, description TEXT, category TEXT, age_group TEXT,
  min_players INTEGER, max_players INTEGER, duration_minutes INTEGER, instructions TEXT, likes_count INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_select" ON public.games FOR SELECT USING (TRUE);
CREATE POLICY "games_insert" ON public.games FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.printable_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, description TEXT, thumbnail TEXT, pdf_url TEXT,
  category TEXT, downloads_count INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.printable_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "printable_templates_select" ON public.printable_templates FOR SELECT USING (TRUE);
CREATE POLICY "printable_templates_insert" ON public.printable_templates FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.training_videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, description TEXT, video_url TEXT, thumbnail TEXT,
  category TEXT, duration_minutes INTEGER, views_count INTEGER DEFAULT 0,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.training_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "training_videos_select" ON public.training_videos FOR SELECT USING (TRUE);
CREATE POLICY "training_videos_insert" ON public.training_videos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.competition_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), title TEXT, start_date DATE, end_date DATE,
  rankings JSONB DEFAULT '[]', total_units INTEGER, total_clans INTEGER,
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.competition_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competition_history_select" ON public.competition_history FOR SELECT USING (TRUE);
CREATE POLICY "competition_history_insert" ON public.competition_history FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT NOT NULL, type TEXT, description TEXT,
  address TEXT, latitude NUMERIC(10,6), longitude NUMERIC(10,6), images JSONB DEFAULT '[]',
  amenities JSONB DEFAULT '[]', capacity INTEGER, contact_info TEXT, status TEXT DEFAULT 'active',
  created_by_id UUID REFERENCES auth.users(id), created_date TIMESTAMPTZ DEFAULT NOW(), updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations_select" ON public.locations FOR SELECT USING (TRUE);
CREATE POLICY "locations_insert" ON public.locations FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin'));

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
