CREATE SCHEMA IF NOT EXISTS app;

ALTER TABLE app.applications
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'app'
      AND indexname = 'uidx_applications_triple'
  ) THEN
    EXECUTE 'DROP INDEX app.uidx_applications_triple';
  END IF;
END$$;

CREATE UNIQUE INDEX IF NOT EXISTS uidx_applications_triple_active
  ON app.applications(user_id, company_id, job_board_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_applications_deleted_at ON app.applications(deleted_at);
