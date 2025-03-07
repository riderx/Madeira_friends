BEGIN;
SELECT plan(5);

-- Test contact_submissions table exists
SELECT has_table('public', 'contact_submissions', 'contact_submissions table should exist');

-- Test contact_submissions table has expected columns
SELECT has_column('public', 'contact_submissions', 'name', 'contact_submissions table should have name column');
SELECT has_column('public', 'contact_submissions', 'email', 'contact_submissions table should have email column');
SELECT has_column('public', 'contact_submissions', 'message', 'contact_submissions table should have message column');

-- Test RLS policies
SELECT policies_are('public', 'contact_submissions', ARRAY['Allow moderators and admins to view contact submissions', 'Allow anyone to insert contact submissions'], 'contact_submissions table should have expected policies');

SELECT * FROM finish();
ROLLBACK;
