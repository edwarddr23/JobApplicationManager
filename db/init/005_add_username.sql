CREATE SCHEMA IF NOT EXISTS app;

ALTER TABLE app.users
  ADD COLUMN IF NOT EXISTS username text UNIQUE;

UPDATE app.users
  SET username = COALESCE(username, email)
  WHERE username IS NULL;

-- Optional: keep it NON NULL if you prefer strictness
-- ALTER TABLE app.users ALTER COLUMN username SET NOT NULL;
