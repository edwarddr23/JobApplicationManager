```mermaid
erDiagram
    USERS {
        UUID id PK
        TEXT username UK
        TEXT firstname
        TEXT lastname
        TEXT email
        TEXT password
    }

    COMPANIES {
        UUID id PK
        UUID user_id FK
        TEXT name UK
        TEXT website
        TEXT location
        TIMESTAMPTZ created_at
    }

    JOB_BOARDS {
        UUID id PK
        UUID user_id FK
        TEXT name UK
        TEXT url
    }

    APPLICATIONS {
        UUID id PK
        UUID user_id FK
        UUID company_id FK
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

    %% Relationships (all 1-to-many)
    USERS      ||--o{ COMPANIES    : owns
    USERS      ||--o{ JOB_BOARDS   : uses
    USERS      ||--o{ APPLICATIONS : submits
    USERS      ||--o{ TAGVALUES    : has

    COMPANIES  ||--o{ APPLICATIONS : receives
    JOB_BOARDS ||--o{ APPLICATIONS : source_of