CREATE SCHEMA IF NOT EXISTS app;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE app.applications
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS company_id uuid,
  ADD COLUMN IF NOT EXISTS job_board_id uuid,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS applied_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS uidx_applications_triple
  ON app.applications(user_id, company_id, job_board_id);

CREATE INDEX IF NOT EXISTS idx_applications_status ON app.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_time ON app.applications(user_id, applied_at DESC);
