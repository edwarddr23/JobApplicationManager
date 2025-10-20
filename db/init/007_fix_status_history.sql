CREATE SCHEMA IF NOT EXISTS app;

ALTER TABLE app.status_history
  ADD COLUMN IF NOT EXISTS status text;

ALTER TABLE app.status_history
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE app.status_history
  ADD COLUMN IF NOT EXISTS changed_at timestamptz DEFAULT now();
