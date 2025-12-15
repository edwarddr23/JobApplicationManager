# JobApplicationManager – Database Schema

---

## 1. Tables (Columns, Types, and Constraints)

---

### 1.1 `users`

**Purpose:** Core user accounts for the system.

| Column     | Type | Constraints                              | Description       |
|------------|------|-------------------------------------------|-------------------|
| id         | UUID | PRIMARY KEY, DEFAULT `gen_random_uuid()` | Surrogate key     |
| username   | TEXT | UNIQUE, NOT NULL                          | Login handle      |
| firstname  | TEXT | NOT NULL                                  | User first name   |
| lastname   | TEXT | NOT NULL                                  | User last name    |
| email      | TEXT | NULLABLE                                  | Contact email     |
| password   | TEXT | NOT NULL                                  | Hashed password   |

---

### 1.2 `companies`

**Purpose:** Companies that users apply to.

| Column      | Type        | Constraints                                                         | Description                       |
|-------------|-------------|----------------------------------------------------------------------|-----------------------------------|
| id          | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`                            | Company identifier                |
| user_id     | UUID        | FOREIGN KEY → `users.id`, NULLABLE, `ON DELETE SET NULL`            | User who created or owns company  |
| name        | TEXT        | NOT NULL                                                            | Company name                      |
| website     | TEXT        | NULLABLE                                                            | Website URL                       |
| location    | TEXT        | NULLABLE                                                            | City / region / etc.              |
| created_at  | TIMESTAMPTZ | DEFAULT `now()`                                                     | When this record was created      |

**Constraints:**
- `UNIQUE (user_id, name)`

---

### 1.3 `job_boards`

**Purpose:** Job platforms where postings come from.

| Column      | Type        | Constraints                                                         | Description                        |
|-------------|-------------|----------------------------------------------------------------------|------------------------------------|
| id          | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`                            | Job board identifier               |
| user_id     | UUID        | FOREIGN KEY → `users.id`, NULLABLE, `ON DELETE SET NULL`            | Optional owner / creator user      |
| name        | TEXT        | NOT NULL                                                            | Platform name (LinkedIn, Indeed…)  |
| url         | TEXT        | NULLABLE                                                            | Base URL                           |
| created_at  | TIMESTAMPTZ | DEFAULT `now()`                                                     | When this record was created       |

**Constraints:**
- `UNIQUE (user_id, name)`

---

### 1.4 `applications`

**Purpose:** Individual job applications submitted by users.

| Column                | Type        | Constraints                                                         | Description                               |
|-----------------------|-------------|----------------------------------------------------------------------|-------------------------------------------|
| id                    | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`                            | Application identifier                    |
| user_id               | UUID        | FOREIGN KEY → `users.id`, NOT NULL, `ON DELETE CASCADE`             | User who submitted the application        |
| company_id            | UUID        | FOREIGN KEY → `companies.id`, NULLABLE, `ON DELETE SET NULL`        | Target company (FK)                       |
| custom_company_name   | TEXT        | NULLABLE                                                            | Manual company name if no FK              |
| job_board_id          | UUID        | FOREIGN KEY → `job_boards.id`, NULLABLE, `ON DELETE SET NULL`       | Source job board                          |
| job_title             | TEXT        | NOT NULL                                                            | Job title                                 |
| status                | TEXT        | CHECK (`status` IN ('applied','offer','rejected','withdrawn'))     | Application status                        |
| applied_at            | TIMESTAMPTZ | DEFAULT `now()`                                                     | When application was created              |
| last_updated          | TIMESTAMPTZ | DEFAULT `now()`                                                     | Last update timestamp                     |

---

### 1.5 `tagvalues`

**Purpose:** Flexible key–value metadata per user (links, bios, etc.).

| Column      | Type        | Constraints                                                         | Description                             |
|-------------|-------------|----------------------------------------------------------------------|-----------------------------------------|
| id          | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`                            | Tag identifier                          |
| user_id     | UUID        | FOREIGN KEY → `users.id`, NOT NULL, `ON DELETE CASCADE`             | Owner user                              |
| tag         | TEXT        | NOT NULL                                                            | Tag name (e.g., LinkedIn URL)            |
| value       | TEXT        | NOT NULL                                                            | Tag value                               |
| type        | TEXT        | CHECK (`type` IN ('link','text')), NOT NULL                         | Value type                              |
| created_at  | TIMESTAMPTZ | DEFAULT `now()`                                                     | Creation timestamp                      |
| updated_at  | TIMESTAMPTZ | DEFAULT `now()`                                                     | Last modification timestamp             |

**Constraints:**
- `UNIQUE (user_id, tag)`

---

### 1.6 `cover_letters`

**Purpose:** Stores uploaded cover letter files per user.

| Column      | Type        | Constraints                                                         | Description                           |
|-------------|-------------|----------------------------------------------------------------------|---------------------------------------|
| id          | UUID        | PRIMARY KEY, DEFAULT `gen_random_uuid()`                            | Cover letter identifier               |
| user_id     | UUID        | FOREIGN KEY → `users.id`, NOT NULL, `ON DELETE CASCADE`             | Owner user                            |
| name        | TEXT        | NOT NULL                                                            | Display name                          |
| file_path  | TEXT        | NOT NULL                                                            | Relative file path                    |
| created_at | TIMESTAMPTZ | DEFAULT `now()`                                                     | When this record was created          |

---

## 2. Relationship Overview

- One user can have many companies  
- One user can have many job boards  
- One user can submit many applications  
- One user can have many tagvalues  
- One user can have many cover letters  
- One company can have many applications  
- One job board can be associated with many applications  

All relationships are enforced using foreign keys defined in `server/db/init.ts`.

---