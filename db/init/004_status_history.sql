CREATE SCHEMA IF NOT EXISTS app;

CREATE TABLE IF NOT EXISTS app.status_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_id uuid NOT NULL,
  job_board_id uuid NOT NULL,
  status text NOT NULL CHECK (status IN (
    'applied','in_review','oa','phone','onsite','offer','rejected','withdrawn'
  )),
  note text,
  changed_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (user_id, company_id, job_board_id)
    REFERENCES app.applications(user_id, company_id, job_board_id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_status_history_app_time
  ON app.status_history(user_id, company_id, job_board_id, changed_at DESC);
