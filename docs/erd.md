erDiagram
  USERS {
    UUID id PK
    TEXT username UNIQUE
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
    UNIQUE user_id_name
  }

  JOB_BOARDS {
    UUID id PK
    UUID user_id FK
    TEXT name
    TEXT url
    TIMESTAMPTZ created_at
    UNIQUE user_id_name
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
    UNIQUE user_id_tag
  }

  COVER_LETTERS {
    UUID id PK
    UUID user_id FK
    TEXT name
    TEXT file_path
    TIMESTAMPTZ created_at
  }

  USERS ||--o{ COMPANIES : "user_id (SET NULL)"
  USERS ||--o{ JOB_BOARDS : "user_id (SET NULL)"
  USERS ||--o{ APPLICATIONS : "user_id (CASCADE)"
  USERS ||--o{ TAGVALUES : "user_id (CASCADE)"
  USERS ||--o{ COVER_LETTERS : "user_id (CASCADE)"

  COMPANIES ||--o{ APPLICATIONS : "company_id (SET NULL)"
  JOB_BOARDS ||--o{ APPLICATIONS : "job_board_id (SET NULL)"