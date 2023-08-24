\echo 'Delete and recreate jobly db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE my_calorie_buddy;
CREATE DATABASE my_calorie_buddy;
\connect my_calorie_buddy

\i jobly-schema.sql
\i jobly-seed.sql

\echo 'Delete and recreate jobly_test db?'
\prompt 'Return for yes or control-C to cancel > ' 

-- DROP DATABASE jobly_test;
-- CREATE DATABASE jobly_test;
-- \connect jobly_test

-- \i jobly-schema.sql

