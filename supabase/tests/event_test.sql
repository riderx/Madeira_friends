BEGIN;
SELECT plan(1);

-- Examples: https://pgtap.org/documentation.html
-- Simple passing test to satisfy pgTAP requirements
SELECT ok(TRUE, 'This test always passes');

SELECT * FROM finish();
ROLLBACK;
