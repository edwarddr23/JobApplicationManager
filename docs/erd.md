# ERD (Core)

```mermaid
erDiagram
  users ||--o{ applications : "applies to"
  companies ||--o{ applications : "has apps"
  job_boards ||--o{ applications : "source"

  users {
    uuid id PK
    text username UK
    text password_hash
    text email
    timestamptz created_at
  }

  companies {
    uuid id PK
    text name UK
    text website
    text location
    timestamptz created_at
  }

  job_boards {
    uuid id PK
    text name UK
    text url
  }

  applications {
    uuid user_id FK
    uuid company_id FK
    uuid job_board_id FK
    text status        "applied,in_review,oa,phone,onsite,offer,rejected,withdrawn"
    timestamptz applied_at
    timestamptz updated_at
    PK "user_id, company_id, job_board_id"
  }
