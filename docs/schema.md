# JobApplicationManager – Database Schema

This schema reflects the current tables created in `server/db/init.ts`.

---

## 1. Tables (Columns, Types, Constraints)

### 1.1 `users`

**Purpose:** Core user accounts for the system.

| Column    | Type  | Constraints                               | Description                 |
|----------|-------|--------------------------------------------|-----------------------------|
| id       | UUID  | PRIMARY KEY, DEFAULT `gen_random_uuid()`   | Surrogate key               |
| username | TEXT  | UNIQUE, NOT NULL                           | Login handle                |
| firstname| TEXT  | NOT NULL                                   | User’s first name           |
| lastname | TEXT  | NOT NULL                                   | User’s last name            |
| email    | TEXT  | NULLABLE                                   | Contact email               |
| password | TEXT  | NOT NULL                                   | Hashed password             |

---

### 1.2 `companies`

**Purpose:** Companies that users apply to.

| Column     | Type       | Constraints                                                   | Description                              |
|-----------|------------|---------------------------------------------------------------|------------------------------------------|
| id        | UUID       | PRIMARY KEY, DEFAULT `gen_random_uuid()`                      | Company identifier                       |
| user_id   | UUID       | FOREIGN KEY → `users.id`, NULLABLE, `ON DELETE SET NULL`      | Which user created/owns this company     |
| name      | TEXT       | UNIQUE, NOT NULL                                              | Company name                             |
| website   | TEXT       | NULLABLE                                                      | Website URL                              |
| location  | TEXT       | NULLABLE                                                      | City/region/etc.                         |
| created_at| TIMESTAMPTZ| DEFAULT `now()`                                               | When this record was created             |

---

### 1.3 `job_boards`

**Purpose:** Job platforms where postings come from.

| Column   | Type       | Constraints                                                   | Description                         |
|---------|------------|---------------------------------------------------------------|-------------------------------------|
| id      | UUID       | PRIMARY KEY, DEFAULT `gen_random_uuid()`                      | Job board identifier                |
| user_id | UUID       | FOREIGN KEY → `users.id`, NULLABLE, `ON DELETE SET NULL`      | Optional owner/creator user         |
| name    | TEXT       | UNIQUE, NOT NULL                                              | Platform name (LinkedIn, Indeed…)   |
| url     | TEXT       | NULLABLE                                                      | Base URL                            |

---

### 1.4 `applications`

**Purpose:** Individual job applications submitted by users.

| Column        | Type       | Constraints                                                                    | Description                                |
|--------------|------------|--------------------------------------------------------------------------------|--------------------------------------------|
| id           | UUID       | PRIMARY KEY, DEFAULT `gen_random_uuid()`                                       | Application identifier                     |
| user_id      | UUID       | FOREIGN KEY → `users.id`, NOT NULL, `ON DELETE CASCADE`                        | Who submitted this application             |
| company_id   | UUID       | FOREIGN KEY → `companies.id`, NULLABLE, `ON DELETE SET NULL`                   | Target company                             |
| job_board_id | UUID       | FOREIGN KEY → `job_boards.id`, NULLABLE, `ON DELETE SET NULL`                  | Source job board                           |
| job_title    | TEXT       | NOT NULL                                                                       | Title of the position                      |
| status       | TEXT       | CHECK IN `('applied','offer','rejected','withdrawn')`                          | Current state of the application           |
| applied_at   | TIMESTAMPTZ| DEFAULT `now()`                                                                | When the application was created           |
| last_updated | TIMESTAMPTZ| DEFAULT `now()`                                                                | Last time status/details were updated      |

---

### 1.5 `tagvalues`

**Purpose:** Flexible key–value tags per user (links, bios, etc.).

| Column     | Type       | Constraints                                                   | Description                                      |
|-----------|------------|---------------------------------------------------------------|--------------------------------------------------|
| id        | UUID       | PRIMARY KEY, DEFAULT `gen_random_uuid()`                      | Tag row identifier                               |
| user_id   | UUID       | FOREIGN KEY → `users.id`, NOT NULL, `ON DELETE CASCADE`       | Owner user                                       |
| tag       | TEXT       | NOT NULL                                                      | Tag name (e.g. “LinkedIn URL”, “Portfolio”)      |
| value     | TEXT       | NOT NULL                                                      | Tag value (URL or text)                          |
| type      | TEXT       | NOT NULL, CHECK IN `('link','text')`                          | Distinguishes links vs free text                 |
| created_at| TIMESTAMPTZ| DEFAULT `now()`                                               | Creation timestamp                               |
| updated_at| TIMESTAMPTZ| DEFAULT `now()`                                               | Last modification timestamp                      |
| (user_id, tag) |        | UNIQUE                                                        | One row per (user, tag) combination              |

---

## 2. Relationship Overview (1–1 / 1–Many / Many–Many)

### 2.1 One-to-Many Relationships

- **users (1) → (N) companies**  
  - via `companies.user_id` (nullable, `ON DELETE SET NULL`)

- **users (1) → (N) job_boards**  
  - via `job_boards.user_id` (nullable, `ON DELETE SET NULL`)

- **users (1) → (N) applications**  
  - via `applications.user_id` (NOT NULL, `ON DELETE CASCADE`)

- **users (1) → (N) tagvalues**  
  - via `tagvalues.user_id` (NOT NULL, `ON DELETE CASCADE`)

- **companies (1) → (N) applications**  
  - via `applications.company_id` (nullable, `ON DELETE SET NULL`)

- **job_boards (1) → (N) applications**  
  - via `applications.job_board_id` (nullable, `ON DELETE SET NULL`)

### 2.2 One-to-One Relationships

- None explicitly defined (no unique foreign keys enforcing 1–1).

### 2.3 Many-to-Many Relationships

- None implemented yet.  
  A future many-to-many (e.g. applications ↔ tags) would require a join table.

---

## 3. SQL (DDL) from `server/db/init.ts`

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT,
    password TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT UNIQUE NOT NULL,
    website TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS job_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT UNIQUE NOT NULL,
    url TEXT
);

CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
    job_board_id UUID REFERENCES job_boards(id) ON DELETE SET NULL,
    job_title TEXT NOT NULL,
    status TEXT CHECK (status IN ('applied','offer','rejected','withdrawn')),
    applied_at TIMESTAMPTZ DEFAULT now(),
    last_updated TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tagvalues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    value TEXT NOT NULL,
    type TEXT CHECK (type IN ('link', 'text')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, tag)
);