# JobApplicationManager – Database Schema

This schema reflects the current tables created in `server/db/init.ts`.

---

## 1. Tables (Columns, Types, and Constraints)

### 1.1 `users`

**Purpose:** Core user accounts for the system.

| Column     | Type  | Constraints                               | Description       |
|-----------|-------|--------------------------------------------|-------------------|
| id        | UUID  | PRIMARY KEY, DEFAULT `gen_random_uuid()`   | Surrogate key     |
| username  | TEXT  | UNIQUE, NOT NULL                           | Login handle      |
| firstname | TEXT  | NOT NULL                                   | User first name   |
| lastname  | TEXT  | NOT NULL                                   | User last name    |
| email     | TEXT  | NULLABLE                                   | Contact email     |
| password  | TEXT  | NOT NULL                                   | Hashed password   |

---

### 1.2 `companies`

**Purpose:** Companies that users apply to.

| Column     | Type       | Constraints                                                        | Description                        |
|-----------|------------|--------------------------------------------------------------------|------------------------------------|
| id        | UUID       | PRIMARY KEY, DEFAULT `gen_random_uuid()`                           | Company identifier                 |
| user_id   | UUID       | FOREIGN KEY referencing `users.id`, NULLABLE, `ON DELETE SET NULL` | User who created or owns company   |
| name      | TEXT       | UNIQUE, NOT NULL                                                   | Company name                       |
| website   | TEXT       | NULLABLE                                                           | Website URL                        |
| location  | TEXT       | NULLABLE                                                           | City / region / etc.               |
| created_at| TIMESTAMPTZ| DEFAULT `now()`                                                    | When this record was created       |

---

### 1.3 `job_boards`

**Purpose:** Job platforms where postings come from.

| Column    | Type       | Constraints                                                        | Description                       |
|----------|------------|--------------------------------------------------------------------|-----------------------------------|
| id       | UUID       | PRIMARY KEY, DEFAULT `gen_random_uuid()`                           | Job board identifier              |
| user_id  | UUID       | FOREIGN KEY referencing `users.id`, NULLABLE, `ON DELETE SET NULL` | Optional owner / creator user     |
| name     | TEXT       | UNIQUE, NOT NULL                                                   | Platform name (LinkedIn, Indeed…) |
| url      | TEXT       | NULLABLE                                                           | Base URL                          |

---

### 1.4 `applications`

**Purpose:** Individual job applications submitted by users.

| Column        | Type       | Constraints                                                                    | Description                             |
|--------------|------------|--------------------------------------------------------------------------------|-----------------------------------------|
| id           | UUID       | PRIMARY KEY, DEFAULT `gen_random_uuid()`                                       | Application identifier                  |
| user_id      | UUID       | FOREIGN KEY referencing `users.id`, NOT NULL, `ON DELETE CASCADE`              | User who submitted the application      |
| company_id   | UUID       | FOREIGN KEY referencing `companies.id`, NULLABLE, `ON DELETE SET NULL`         | Target company                          |
| job_board_id | UUID       | FOREIGN KEY referencing `job_boards.id`, NULLABLE, `ON DELETE SET NULL`        | Source job board                        |
| job_title    | TEXT       | NOT NULL                                                                       | Title of the position                   |
| status       | TEXT       | CHECK in `('applied','offer','rejected','withdrawn')`                          | Current application status              |
| applied_at   | TIMESTAMPTZ| DEFAULT `now()`                                                                | When the application was created        |
| last_updated | TIMESTAMPTZ| DEFAULT `now()`                                                                | Last time status or details were updated|

---

### 1.5 `tagvalues`

**Purpose:** Flexible key–value tags per user (links, bios, etc.).

| Column        | Type       | Constraints                                                        | Description                                   |
|--------------|------------|--------------------------------------------------------------------|-----------------------------------------------|
| id           | UUID       | PRIMARY KEY, DEFAULT `gen_random_uuid()`                           | Tag row identifier                            |
| user_id      | UUID       | FOREIGN KEY referencing `users.id`, NOT NULL, `ON DELETE CASCADE`  | Owner user                                    |
| tag          | TEXT       | NOT NULL                                                           | Tag name (for example “LinkedIn URL”)         |
| value        | TEXT       | NOT NULL                                                           | Tag value (URL or text)                       |
| type         | TEXT       | NOT NULL, CHECK in `('link','text')`                               | Distinguishes links vs free text              |
| created_at   | TIMESTAMPTZ| DEFAULT `now()`                                                    | Creation timestamp                            |
| updated_at   | TIMESTAMPTZ| DEFAULT `now()`                                                    | Last modification timestamp                   |
| (user_id,tag)| —          | UNIQUE                                                             | One row per (user, tag) combination           |

---

## 2. Relationship Overview

High-level view of how tables relate:

- One user can have many companies  
  - Implemented by `companies.user_id` (nullable, `ON DELETE SET NULL`).

- One user can have many job boards  
  - Implemented by `job_boards.user_id` (nullable, `ON DELETE SET NULL`).

- One user can create many applications  
  - Implemented by `applications.user_id` (not null, `ON DELETE CASCADE`).

- One user can have many tagvalues  
  - Implemented by `tagvalues.user_id` (not null, `ON DELETE CASCADE`).

- One company can have many applications  
  - Implemented by `applications.company_id` (nullable, `ON DELETE SET NULL`).

- One job board can be the source of many applications  
  - Implemented by `applications.job_board_id` (nullable, `ON DELETE SET NULL`).

No explicit one-to-one or many-to-many tables are defined in the current schema.

---

## 3. SQL Schema (CREATE TABLE statements from `server/db/init.ts`)

These statements are the exact definitions Postgres uses to create the tables.

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
    type TEXT CHECK (type IN ('link','text')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id, tag)
);