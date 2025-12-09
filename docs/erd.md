```mermaid
---
title: JobApplicationManager ERD
---
erDiagram
    USERS {
        UUID id PK
        TEXT username UK
        TEXT email
        TEXT password
    }

    COMPANIES {
        UUID id PK
        TEXT name UK
        UUID user_id FK
        TEXT location
    }

    JOB_BOARDS {
        UUID id PK
        TEXT name UK
        UUID user_id FK
    }

    APPLICATIONS {
        UUID id PK
        UUID user_id FK
        UUID company_id FK
        UUID job_board_id FK
        TEXT job_title
        TEXT status
    }

    TAGVALUES {
        UUID id PK
        UUID user_id FK
        TEXT tag
        TEXT type
    }

    %% Relationships with cardinalities
    USERS      ||--o{ COMPANIES    : creates
    USERS      ||--o{ JOB_BOARDS   : defines
    USERS      ||--o{ APPLICATIONS : submits
    USERS      ||--o{ TAGVALUES    : has

    COMPANIES  ||--o{ APPLICATIONS : receives
    JOB_BOARDS ||--o{ APPLICATIONS : source_off