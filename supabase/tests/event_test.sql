BEGIN;
SELECT plan(1);

-- Test that the events table exists
SELECT has_table('public', 'events', 'Events table should exist');

SELECT * FROM finish();
ROLLBACK;
