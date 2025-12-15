erDiagram
  USERS {
    UUID id PK
    TEXT username "UNIQUE, NOT NULL"
    TEXT firstname "NOT NULL"
    TEXT lastname "NOT NULL"
    TEXT email
    TEXT password "NOT NULL"
  }

  COMPANIES {
    UUID id PK
    UUID user_id FK
    TEXT name "NOT NULL"
    TEXT website
    TEXT location
    TIMESTAMPTZ created_at
  }

  JOB_BOARDS {
    UUID id PK
    UUID user_id FK
    TEXT name "NOT NULL"
    TEXT url
    TIMESTAMPTZ created_at
  }

  APPLICATIONS {
    UUID id PK
    UUID user_id FK
    UUID company_id FK
    TEXT custom_company_name
    UUID job_board_id FK
    TEXT job_title "NOT NULL"
    TEXT status
    TIMESTAMPTZ applied_at
    TIMESTAMPTZ last_updated
  }

  TAGVALUES {
    UUID id PK
    UUID user_id FK
    TEXT tag "NOT NULL"
    TEXT value "NOT NULL"
    TEXT type "NOT NULL"
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }

  COVER_LETTERS {
    UUID id PK
    UUID user_id FK
    TEXT name "NOT NULL"
    TEXT file_path "NOT NULL"
    TIMESTAMPTZ created_at
  }

  USERS ||--o{ COMPANIES : "user_id (SET NULL)"
  USERS ||--o{ JOB_BOARDS : "user_id (SET NULL)"
  USERS ||--o{ APPLICATIONS : "user_id (CASCADE)"
  USERS ||--o{ TAGVALUES : "user_id (CASCADE)"
  USERS ||--o{ COVER_LETTERS : "user_id (CASCADE)"

  COMPANIES ||--o{ APPLICATIONS : "company_id (SET NULL)"
  JOB_BOARDS ||--o{ APPLICATIONS : "job_board_id (SET NULL)"

**Constraint notes (from `server/db/init.ts`):**
- `companies`: `UNIQUE (user_id, name)` (unique per user)
- `job_boards`: `UNIQUE (user_id, name)` (unique per user)
- `tagvalues`: `UNIQUE (user_id, tag)` (one row per tag per user)
- `applications.status`: CHECK in ('applied','offer','rejected','withdrawn')  