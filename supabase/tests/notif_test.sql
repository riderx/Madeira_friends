BEGIN;
SELECT plan(1);

-- Test that the notifications table exists
SELECT has_table('public', 'notifications', 'Notifications table should exist');

SELECT * FROM finish();
ROLLBACK;
