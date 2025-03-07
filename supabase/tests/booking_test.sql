BEGIN;
SELECT plan(1);

-- Test that the bookings table exists or will be created
SELECT has_table('public', 'events', 'Events table should exist');

SELECT * FROM finish();
ROLLBACK;
