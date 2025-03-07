BEGIN;
SELECT plan(3);

-- Test 1: Anonymous user can insert valid data
SET LOCAL ROLE anon;
INSERT INTO "public"."contact_form" ("name", "email", "phone", "subject", "message")
VALUES ('Test User', 'test@example.com', '123-456-7890', 'Test Subject', 'Test Message');
SELECT pass('Anonymous user can insert data into contact_form');

-- Test 2: Anonymous users cannot select data (RLS policy)
SELECT throws_ok(
  $$ SELECT * FROM "public"."contact_form" LIMIT 1 $$,
  'insufficient_privilege',
  'Anonymous users should not be able to select from contact_form'
);

-- Test 3: Authenticated users can select data (RLS policy)
SET LOCAL ROLE authenticated;
SELECT lives_ok(
  $$ SELECT * FROM "public"."contact_form" LIMIT 1 $$,
  'Authenticated users should be able to select from contact_form'
);

-- Clean up test data
DELETE FROM "public"."contact_form" WHERE "email" = 'test@example.com';

SELECT * FROM finish();
ROLLBACK;
