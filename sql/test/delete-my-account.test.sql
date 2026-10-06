\set ON_ERROR_STOP on
-- Two users. ALICE deletes herself; BOB must be untouched.
INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-4111-8111-111111111111','alice@example.com'),
  ('22222222-2222-4222-8222-222222222222','bob@example.com');

INSERT INTO public.pitch_pages (id, user_id, slug) VALUES
  ('aaaa1111-1111-4111-8111-111111111111','11111111-1111-4111-8111-111111111111','alice-1'),
  ('aaaa2222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111','alice-2'),
  ('bbbb1111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222','bob-1');

INSERT INTO public.pitch_page_views (pitch_page_id)
  SELECT id FROM public.pitch_pages, generate_series(1,5);
INSERT INTO public.pitch_page_links (pitch_page_id) SELECT id FROM public.pitch_pages;
INSERT INTO public.outreach_enrollments (pitch_page_id) SELECT id FROM public.pitch_pages;
INSERT INTO public.org_outcomes (pitch_page_id, user_id) SELECT id, user_id FROM public.pitch_pages;
INSERT INTO public.org_sponsorships (pitch_page_id, user_id) SELECT id, user_id FROM public.pitch_pages;
INSERT INTO public.pitch_page_chat_messages (pitch_page_id, user_id) SELECT id, user_id FROM public.pitch_pages;
INSERT INTO public.credit_transactions (pitch_page_id, user_id) SELECT id, user_id FROM public.pitch_pages;
INSERT INTO public.profiles (user_id) SELECT id FROM auth.users;
INSERT INTO public.user_credits (user_id, balance) SELECT id, 3 FROM auth.users;
INSERT INTO public.org_members (user_id, org_id) SELECT id, gen_random_uuid() FROM auth.users;
INSERT INTO public.voice_sessions (user_id) SELECT id FROM auth.users;
INSERT INTO public.push_subscriptions (user_id) SELECT id FROM auth.users;
INSERT INTO public.org_nudges (actor_id) SELECT id FROM auth.users;
INSERT INTO storage.objects (name) VALUES
  ('11111111-1111-4111-8111-111111111111/portrait.jpg'),
  ('11111111-1111-4111-8111-111111111111/intro.mp4'),
  ('22222222-2222-4222-8222-222222222222/portrait.jpg');

\echo '--- no caller must be refused ---'
SELECT set_config('test.uid', '', false);
DO $$ BEGIN
  PERFORM public.delete_my_account();
  RAISE EXCEPTION 'FAIL: ran with no signed-in user';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%no signed-in user%' THEN RAISE NOTICE 'PASS: refused with no caller';
  ELSE RAISE EXCEPTION 'FAIL: wrong error: %', SQLERRM; END IF;
END $$;

\echo '--- alice deletes herself ---'
SELECT set_config('test.uid', '11111111-1111-4111-8111-111111111111', false);
SELECT public.delete_my_account();

\echo '--- the storage guard is back on once the call has ended ---'
DO $$ BEGIN
  DELETE FROM storage.objects WHERE false;
  RAISE EXCEPTION 'FAIL: the storage guard stayed off after the call';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM LIKE '%Direct deletion from storage tables%' THEN RAISE NOTICE 'PASS: storage guard back on';
  ELSE RAISE EXCEPTION 'FAIL: wrong error: %', SQLERRM; END IF;
END $$;

\echo '--- results: alice must be 0 everywhere, bob untouched ---'
SELECT 'auth.users'          AS t, count(*) FILTER (WHERE id='11111111-1111-4111-8111-111111111111') AS alice, count(*) FILTER (WHERE id='22222222-2222-4222-8222-222222222222') AS bob FROM auth.users
UNION ALL SELECT 'pitch_pages', count(*) FILTER (WHERE user_id='11111111-1111-4111-8111-111111111111'), count(*) FILTER (WHERE user_id='22222222-2222-4222-8222-222222222222') FROM public.pitch_pages
UNION ALL SELECT 'profiles', count(*) FILTER (WHERE user_id='11111111-1111-4111-8111-111111111111'), count(*) FILTER (WHERE user_id='22222222-2222-4222-8222-222222222222') FROM public.profiles
UNION ALL SELECT 'user_credits', count(*) FILTER (WHERE user_id='11111111-1111-4111-8111-111111111111'), count(*) FILTER (WHERE user_id='22222222-2222-4222-8222-222222222222') FROM public.user_credits
UNION ALL SELECT 'org_members', count(*) FILTER (WHERE user_id='11111111-1111-4111-8111-111111111111'), count(*) FILTER (WHERE user_id='22222222-2222-4222-8222-222222222222') FROM public.org_members
UNION ALL SELECT 'voice_sessions', count(*) FILTER (WHERE user_id='11111111-1111-4111-8111-111111111111'), count(*) FILTER (WHERE user_id='22222222-2222-4222-8222-222222222222') FROM public.voice_sessions
UNION ALL SELECT 'push_subscriptions', count(*) FILTER (WHERE user_id='11111111-1111-4111-8111-111111111111'), count(*) FILTER (WHERE user_id='22222222-2222-4222-8222-222222222222') FROM public.push_subscriptions
UNION ALL SELECT 'org_nudges', count(*) FILTER (WHERE actor_id='11111111-1111-4111-8111-111111111111'), count(*) FILTER (WHERE actor_id='22222222-2222-4222-8222-222222222222') FROM public.org_nudges
UNION ALL SELECT 'storage.objects', count(*) FILTER (WHERE name LIKE '11111111%'), count(*) FILTER (WHERE name LIKE '22222222%') FROM storage.objects
UNION ALL SELECT 'page_views(orphan)', count(*), 0 FROM public.pitch_page_views v LEFT JOIN public.pitch_pages p ON p.id=v.pitch_page_id WHERE p.id IS NULL
UNION ALL SELECT 'page_links(orphan)', count(*), 0 FROM public.pitch_page_links l LEFT JOIN public.pitch_pages p ON p.id=l.pitch_page_id WHERE p.id IS NULL
ORDER BY 1;
