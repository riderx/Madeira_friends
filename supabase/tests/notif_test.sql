BEGIN;
SELECT plan(0);

-- Examples: https://pgtap.org/documentation.html
-- TODO: Implement actual tests

SELECT * FROM finish();
ROLLBACK;
