BEGIN;
SELECT plan(5);

-- Test RLS policies for contact_submissions table
SELECT has_table('public', 'contact_submissions', 'Should have contact_submissions table');

-- Test that anonymous users can insert into contact_submissions
SELECT lives_ok(
  $$
    SET LOCAL ROLE anon;
    INSERT INTO public.contact_submissions (name, email, subject, message, ip_address)
    VALUES ('Test User', 'test@example.com', 'Test Subject', 'Test Message', '127.0.0.1');
  $$,
  'Anonymous users should be able to insert into contact_submissions'
);

-- Test that anonymous users cannot select from contact_submissions
SELECT throws_ok(
  $$
    SET LOCAL ROLE anon;
    SELECT * FROM public.contact_submissions;
  $$,
  'permission denied for table contact_submissions',
  'Anonymous users should not be able to select from contact_submissions'
);

-- Test that authenticated users cannot select from contact_submissions
SELECT throws_ok(
  $$
    SET LOCAL ROLE authenticated;
    SELECT * FROM public.contact_submissions;
  $$,
  'permission denied for table contact_submissions',
  'Authenticated users should not be able to select from contact_submissions'
);

-- Test that service_role can access contact_submissions
SELECT lives_ok(
  $$
    SET LOCAL ROLE service_role;
    SELECT * FROM public.contact_submissions;
  $$,
  'Service role should be able to select from contact_submissions'
);

SELECT * FROM finish();
ROLLBACK;
