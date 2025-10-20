CREATE SCHEMA IF NOT EXISTS app;

ALTER TABLE app.users
  ADD COLUMN IF NOT EXISTS password_hash text;

UPDATE app.users
  SET password_hash = COALESCE(password_hash, 'placeholder');

ALTER TABLE app.users
  ALTER COLUMN username SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_users_username ON app.users(username);
