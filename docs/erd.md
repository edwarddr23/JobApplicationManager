# JobApplicationManager — ERD (Entity Relationship Diagram)

This ERD reflects the current schema in `server/db/init.ts`.

```mermaid
erDiagram
  USERS {
    UUID id PK
    TEXT username
    TEXT firstname
    TEXT lastname
    TEXT email
    TEXT password
  }

  COMPANIES {
    UUID id PK
    UUID user_id FK
    TEXT name
    TEXT website
    TEXT location
    TIMESTAMPTZ created_at
  }

  JOB_BOARDS {
    UUID id PK
    UUID user_id FK
    TEXT name
    TEXT url
    TIMESTAMPTZ created_at
  }

  APPLICATIONS {
    UUID id PK
    UUID user_id FK
    UUID company_id FK
    TEXT custom_company_name
    UUID job_board_id FK
    TEXT job_title
    TEXT status
    TIMESTAMPTZ applied_at
    TIMESTAMPTZ last_updated
  }

  TAGVALUES {
    UUID id PK
    UUID user_id FK
    TEXT tag
    TEXT value
    TEXT type
    TIMESTAMPTZ created_at
    TIMESTAMPTZ updated_at
  }

  COVER_LETTERS {
    UUID id PK
    UUID user_id FK
    TEXT name
    TEXT file_path
    TIMESTAMPTZ created_at
  }

  USERS ||--o{ COMPANIES : owns
  USERS ||--o{ JOB_BOARDS : uses
  USERS ||--o{ APPLICATIONS : submits
  USERS ||--o{ TAGVALUES : has
  USERS ||--o{ COVER_LETTERS : uploads

  COMPANIES ||--o{ APPLICATIONS : receives
  JOB_BOARDS ||--o{ APPLICATIONS : source