BEGIN;
SELECT plan(1);

-- Test that the bookings table exists
SELECT has_table('public', 'bookings', 'Bookings table should exist');

SELECT * FROM finish();
ROLLBACK;
