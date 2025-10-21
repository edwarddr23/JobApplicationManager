# Job Application Manager — Schema Design

## Tables
- users (id PK uuid, username unique, password_hash, created_at)
- companies (id PK uuid, name unique, website, created_at)
- job_boards (id PK uuid, name unique, url, created_at)
- applications (
  id PK uuid,
  user_id FK -> users.id,
  company_id FK -> companies.id,
  job_board_id FK -> job_boards.id,
  title,
  url,
  status,
  applied_at timestamptz default now(),
  updated_at timestamptz default now(),
  deleted_at timestamptz null,
  UNIQUE (user_id, company_id, job_board_id, title)
)

## Notes
- applications.status stores the current state; history can live in a separate table if needed.
- soft delete via applications.deleted_at.
- updated_at maintained by trigger or application layer.
