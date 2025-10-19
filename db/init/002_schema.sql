-- Schema
CREATE SCHEMA IF NOT EXISTS app;

-- Users
CREATE TABLE IF NOT EXISTS app.users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text,
  display_name  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Companies
CREATE TABLE IF NOT EXISTS app.companies (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL UNIQUE,
  website    text,
  location   text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Job boards (Indeed, LinkedIn, etc.)
CREATE TABLE IF NOT EXISTS app.job_boards (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  url  text
);

-- Job postings (normalized position info)
CREATE TABLE IF NOT EXISTS app.job_postings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES app.companies(id) ON DELETE SET NULL,
  job_board_id  uuid REFERENCES app.job_boards(id) ON DELETE SET NULL,
  title         text NOT NULL,
  url           text,
  job_type      text CHECK (job_type IN ('full_time','part_time','contract','intern','other')) DEFAULT 'full_time',
  salary_min    integer,
  salary_max    integer,
  location      text,
  posted_at     timestamptz
);

-- Canonical statuses (lookup)
CREATE TABLE IF NOT EXISTS app.statuses (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL UNIQUE,   -- applied,in_review,oa,phone,onsite,offer,rejected,withdrawn
  sort_order int  NOT NULL
);

-- Applications (one per user per posting)
CREATE TABLE IF NOT EXISTS app.applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  job_posting_id    uuid REFERENCES app.job_postings(id) ON DELETE SET NULL,
  source_board      text,
  resume_version    text,
  cover_letter_version text,
  current_status_id uuid REFERENCES app.statuses(id) ON DELETE SET NULL,
  applied_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Status history (audit of changes)
CREATE TABLE IF NOT EXISTS app.status_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES app.applications(id) ON DELETE CASCADE,
  status_id       uuid NOT NULL REFERENCES app.statuses(id),
  note            text,
  changed_at      timestamptz NOT NULL DEFAULT now()
);

-- Contacts (recruiters/hiring managers)
CREATE TABLE IF NOT EXISTS app.contacts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  company_id  uuid REFERENCES app.companies(id) ON DELETE SET NULL,
  name        text NOT NULL,
  email       text,
  role        text,
  phone       text,
  notes       text
);

-- Free-form notes on an application
CREATE TABLE IF NOT EXISTS app.notes (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES app.applications(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES app.users(id) ON DELETE CASCADE,
  body           text NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Documents (resume variants, CLs, etc.)
CREATE TABLE IF NOT EXISTS app.documents (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES app.applications(id) ON DELETE CASCADE,
  filename       text NOT NULL,
  kind           text CHECK (kind IN ('resume','cover_letter','portfolio','other')) DEFAULT 'resume',
  url            text NOT NULL,
  uploaded_at    timestamptz NOT NULL DEFAULT now()
);

-- Tags and many-to-many for applications
CREATE TABLE IF NOT EXISTS app.tags (
  id   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS app.application_tags (
  application_id uuid NOT NULL REFERENCES app.applications(id) ON DELETE CASCADE,
  tag_id         uuid NOT NULL REFERENCES app.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (application_id, tag_id)
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_applications_user ON app.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON app.applications(current_status_id);
CREATE INDEX IF NOT EXISTS idx_status_history_app ON app.status_history(application_id, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_postings_company ON app.job_postings(company_id);
CREATE INDEX IF NOT EXISTS idx_notes_app ON app.notes(application_id);

-- Seed statuses (only if not present)
INSERT INTO app.statuses(key, sort_order)
VALUES 
  ('applied',1),('in_review',2),('oa',3),('phone',4),
  ('onsite',5),('offer',6),('rejected',7),('withdrawn',8)
ON CONFLICT (key) DO NOTHING;

