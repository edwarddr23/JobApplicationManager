# Schema Design — Job Application Manager

Version: new_db branch  
Context: Dockerized Postgres 16; server Node/Express; client Vite/React

## Tables

### users
- id uuid PK
- username text UNIQUE NOT NULL
- (future: email, password_hash, created_at)

### companies
- id uuid PK
- name text UNIQUE NOT NULL

### job_boards
- id uuid PK
- name text UNIQUE NOT NULL

### applications
- id uuid PK
- user_id uuid NOT NULL references users(id)
- company_id uuid NOT NULL references companies(id)
- job_board_id uuid NOT NULL references job_boards(id)
- job_title text NOT NULL
- status text CHECK (status IN ('applied','interview','offer','rejected','withdrawn')) DEFAULT 'applied'
- applied_at timestamptz DEFAULT now()
- last_updated timestamptz DEFAULT now()

## Constraints and Indexes

- Foreign keys: ON DELETE RESTRICT to protect history
- Uniques:
  - users.username
  - companies.name
  - job_boards.name
- Helpful indexes:
  - applications(user_id)
  - applications(company_id)
  - applications(job_board_id)
  - applications(status) optional

## Typical Queries

User’s applications with lookups:

SELECT a.*, c.name AS company_name, jb.name AS job_board_name
FROM applications a
JOIN companies c   ON c.id = a.company_id
JOIN job_boards jb ON jb.id = a.job_board_id
WHERE a.user_id = $1
ORDER BY a.last_updated DESC;

Filter by status:

SELECT *
FROM applications
WHERE user_id = $1 AND status = ANY($2::text[])
ORDER BY applied_at DESC;

## Data Flow

Public:
- GET /companies -> [{ id, name }]
- GET /job-boards -> [{ id, name }]

Protected (JWT):
- GET /applications?username=<user> -> user-scoped rows

## Future

- Add users.email and users.password_hash for real auth
- Consider soft delete columns (deleted_at)
- Consider composite index (user_id, status) if needed
