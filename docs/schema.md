# JobApplicationManager – Database Schema

This schema reflects the current tables created in `server/db/init.ts`.

---

## 1. Tables (Column → Type → Constraints)

### 1.1 `users`

**Purpose:** Core user accounts for the system.

**Columns**

- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `username` (TEXT, UNIQUE, NOT NULL)
- `firstname` (TEXT, NOT NULL)
- `lastname` (TEXT, NOT NULL)
- `email` (TEXT, NULLABLE)
- `password` (TEXT, NOT NULL) — hashed password

---

### 1.2 `companies`

**Purpose:** Companies that users apply to.

**Columns**

- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NULLABLE, FOREIGN KEY → `users.id`, ON DELETE SET NULL)  
  → which user “owns”/created this company record
- `name` (TEXT, UNIQUE, NOT NULL)
- `website` (TEXT, NULLABLE)
- `location` (TEXT, NULLABLE)
- `created_at` (TIMESTAMPTZ, DEFAULT now())

---

### 1.3 `job_boards`

**Purpose:** Job platforms where postings come from.

**Columns**

- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NULLABLE, FOREIGN KEY → `users.id`, ON DELETE SET NULL)  
  → optional owner/creator of this job board entry
- `name` (TEXT, UNIQUE, NOT NULL) — e.g. “LinkedIn”, “Indeed”
- `url` (TEXT, NULLABLE)

---

### 1.4 `applications`

**Purpose:** Individual job applications submitted by users.

**Columns**

- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FOREIGN KEY → `users.id`, ON DELETE CASCADE)  
  → who submitted this application
- `company_id` (UUID, NULLABLE, FOREIGN KEY → `companies.id`, ON DELETE SET NULL)  
  → which company this application is for
- `job_board_id` (UUID, NULLABLE, FOREIGN KEY → `job_boards.id`, ON DELETE SET NULL)  
  → which job board the posting came from
- `job_title` (TEXT, NOT NULL)
- `status` (TEXT, CHECK IN `('applied','offer','rejected','withdrawn')`)
- `applied_at` (TIMESTAMPTZ, DEFAULT now())
- `last_updated` (TIMESTAMPTZ, DEFAULT now())

---

### 1.5 `tagvalues`

**Purpose:** Flexible key–value tags per user (links, bios, etc.).

**Columns**

- `id` (UUID, PRIMARY KEY, DEFAULT gen_random_uuid())
- `user_id` (UUID, NOT NULL, FOREIGN KEY → `users.id`, ON DELETE CASCADE)
- `tag` (TEXT, NOT NULL) — e.g. “LinkedIn URL”, “Portfolio”, “Bio”
- `value` (TEXT, NOT NULL)
- `type` (TEXT, NOT NULL, CHECK IN `('link','text')`)
- `created_at` (TIMESTAMPTZ, DEFAULT now())
- `updated_at` (TIMESTAMPTZ, DEFAULT now())
- **UNIQUE (`user_id`, `tag`)** — a given user cannot have the same tag name twice

---

## 2. Relationship Overview (1–1 / 1–Many / Many–Many)

### 2.1 One-to-Many Relationships

All relationships below are **one user/company/board → many dependent records**.

- **users (1) → (N) companies**  
  - via `companies.user_id` (nullable, `ON DELETE SET NULL`)
- **users (1) → (N) job_boards**  
  - via `job_boards.user_id` (nullable, `ON DELETE SET NULL`)
- **users (1) → (N) applications**  
  - via `applications.user_id` (`NOT NULL`, `ON DELETE CASCADE`)
- **users (1) → (N) tagvalues**  
  - via `tagvalues.user_id` (`NOT NULL`, `ON DELETE CASCADE`)
- **companies (1) → (N) applications**  
  - via `applications.company_id` (nullable, `ON DELETE SET NULL`)
- **job_boards (1) → (N) applications**  
  - via `applications.job_board_id` (nullable, `ON DELETE SET NULL`)

### 2.2 One-to-One Relationships

- **None explicitly defined**.  
  All current foreign keys point to “many” side (no unique FK enforcing 1-to-1).

### 2.3 Many-to-Many Relationships

- **None implemented yet.**  
  If we later want “applications ↔ tags” as many-to-many, we would introduce a join table (e.g. `application_tags`) with:
  - `application_id` FK → applications.id  
  - `tagvalue_id` FK → tagvalues.id  

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