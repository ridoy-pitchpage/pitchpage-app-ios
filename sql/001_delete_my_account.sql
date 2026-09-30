-- ─── delete_my_account — account deletion, initiated and completed in the app ─
--
-- WHY THIS FILE EXISTS, AND WHY IT IS HERE RATHER THAN IN THE WEBSITE REPO.
--
-- App Store Review Guideline 5.1.1(v) requires an app that creates accounts to
-- let someone delete theirs from inside the app — not email support, not visit
-- a website. Until this function exists, the app can only send a deletion
-- REQUEST, and the submission will be rejected for it.
--
-- Nothing a signed-in user can already call deletes an account. Removing the
-- row in auth.users needs privileges the browser and the app do not have, so it
-- has to be a SECURITY DEFINER function, which means new SQL.
--
-- The website repo is read-only by instruction, and this does not change it.
-- SQL in that repo never auto-applies either — its own migrations say to paste
-- them into Lovable's SQL editor by hand — so this file follows exactly the
-- same process, and lives in the app repo because the app is what needs it.
--
-- WHAT IT DOES. Deletes everything belonging to the CALLER and then the caller's
-- auth.users row. It takes no arguments: there is no id to pass, so no way to
-- aim it at anybody else. auth.uid() is the only user it can ever act on, and
-- it raises rather than proceeding if there is no caller.
--
-- WHAT IT DOES NOT DO.
--   * It does not delete an organization, even one the caller created. An org
--     usually has other people's pages in it, and deleting it would take their
--     work with it. The caller's MEMBERSHIP goes; the org stays. If they were
--     its only admin, someone has to be given admin before the org is usable
--     again — see STEP 3.
--   * It does not touch anyone else's rows anywhere.
--
-- SAFETY. Every table is deleted from only if it actually exists, so a database
-- missing any of these (they arrived at different times) still runs the whole
-- thing rather than aborting half way. It runs in one transaction: either the
-- account and all of its data go, or nothing does.
--
-- TESTED. `./sql/test/run.sh` runs this against a throwaway PostgreSQL 16 with
-- two users and checks that the caller and every row of theirs goes, that the
-- other user is untouched, that no orphaned rows are left, and that a call with
-- no signed-in user is refused. The mock schema's page-keyed foreign keys have
-- NO cascade, so a wrong delete order fails the test rather than passing
-- quietly, and several tables named below are deliberately missing from it to
-- prove the existence check works. It also runs STEP 2's grant check.
--
-- Run that before you paste this anywhere. It does not need the real database.
--
-- ─── STEP 1 — paste this into Lovable's SQL editor and run it ────────────────

CREATE OR REPLACE FUNCTION public.delete_my_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage, pg_temp
AS $$
DECLARE
  _uid uuid := auth.uid();
  _page_ids uuid[];
  _t text;
  -- Tables keyed by the user themselves.
  _by_user constant text[] := ARRAY[
    'credit_transactions', 'email_sequence_log', 'internal_accounts',
    'org_clients', 'org_members', 'org_outcomes', 'org_sponsorships',
    'outreach_contacts', 'outreach_sends', 'outreach_sequences',
    'outreach_suppressions', 'personal_invite_redemptions',
    'pitch_page_chat_messages', 'platform_admins', 'push_subscriptions',
    'user_credits', 'user_email_connections', 'voice_sessions', 'profiles'
  ];
  -- Tables keyed by one of the user's pages. Deleted first, so a foreign key
  -- from these to pitch_pages cannot block the page delete below.
  _by_page constant text[] := ARRAY[
    'pitch_page_views', 'pitch_page_links', 'pitch_page_chat_messages',
    'outreach_enrollments', 'org_outcomes', 'org_sponsorships',
    'credit_transactions'
  ];
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'delete_my_account: no signed-in user';
  END IF;

  SELECT array_agg(id) INTO _page_ids FROM public.pitch_pages WHERE user_id = _uid;

  IF _page_ids IS NOT NULL THEN
    FOREACH _t IN ARRAY _by_page LOOP
      IF to_regclass('public.' || quote_ident(_t)) IS NOT NULL THEN
        EXECUTE format('DELETE FROM public.%I WHERE pitch_page_id = ANY($1)', _t) USING _page_ids;
      END IF;
    END LOOP;
  END IF;

  DELETE FROM public.pitch_pages WHERE user_id = _uid;

  FOREACH _t IN ARRAY _by_user LOOP
    IF to_regclass('public.' || quote_ident(_t)) IS NOT NULL THEN
      EXECUTE format('DELETE FROM public.%I WHERE user_id = $1', _t) USING _uid;
    END IF;
  END LOOP;

  -- Uploaded portraits and videos. The storage policies put every user's files
  -- in a folder named after their own id, which is what this matches.
  IF to_regclass('storage.objects') IS NOT NULL THEN
    DELETE FROM storage.objects WHERE (storage.foldername(name))[1] = _uid::text;
  END IF;

  -- Last, so anything above that still referenced the user has already gone.
  DELETE FROM auth.users WHERE id = _uid;
END;
$$;

-- Callable by a signed-in user and nobody else. `anon` must never have it: the
-- function trusts auth.uid(), and an anonymous caller has none.
REVOKE ALL ON FUNCTION public.delete_my_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_my_account() TO authenticated;

-- ─── STEP 2 — verify. Run this and read the three rows ───────────────────────
--
--   exists       should be  t
--   anon_can     should be  f
--   authed_can   should be  t
--
-- SELECT
--   to_regprocedure('public.delete_my_account()') IS NOT NULL            AS exists,
--   has_function_privilege('anon',          'public.delete_my_account()', 'EXECUTE') AS anon_can,
--   has_function_privilege('authenticated', 'public.delete_my_account()', 'EXECUTE') AS authed_can;
--
-- ─── STEP 3 — before you announce it ─────────────────────────────────────────
--
-- Delete a THROWAWAY account end to end and check: the pages are gone from
-- /p/<slug>, the row is gone from auth.users, and signing in with that email
-- offers to create a new account rather than finding the old one.
--
-- If your organizations can have exactly one admin, check what happens when
-- that admin deletes themselves: the org survives with no admin, and somebody
-- has to be promoted by hand.
