BEGIN;
SELECT plan(1);

-- Test that the rentals table exists
SELECT has_table('public', 'rentals', 'Rentals table should exist');

SELECT * FROM finish();
ROLLBACK;
