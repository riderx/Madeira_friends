BEGIN;
SELECT plan(1);

-- Test that the profiles table exists (which would be used for notifications)
SELECT has_table('public', 'profiles', 'Profiles table should exist');

SELECT * FROM finish();
ROLLBACK;
