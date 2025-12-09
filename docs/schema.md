# JobApplicationManager – Database Schema & ERD

This document reflects the exact schema implemented in `server/db/init.ts` and includes SQL, relationships, and DBML for easy editing.

---

## 1. Tables (SQL Definition)

### 1.1 `users`

```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email TEXT,
    password TEXT NOT NULL
);

### 1.2 companies

CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT UNIQUE NOT NULL,
    website TEXT,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

### 1.3 job_boards

CREATE TABLE IF NOT EXISTS job_boards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT UNIQUE NOT NULL,
    url TEXT
);

### 1.4 applications

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

### 1.5 tagvalues

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

### 2. Relationship Diagram (Text-Based)

users
 ├──< companies        (1 user   → many companies)
 ├──< job_boards       (1 user   → many job boards)
 ├──< applications     (1 user   → many applications)
 └──< tagvalues        (1 user   → many tagvalues)

companies
 └──< applications     (1 company → many applications)

job_boards
 └──< applications     (1 job board → many applications)



### 3. Entity Notes (Readable Documentation)

users
	•	Central table.
	•	Parent of companies, job boards, applications, and tagvalues.
	•	Deleting a user cascades delete to:
	•	applications
	•	tagvalues

companies
	•	Linked to users.
	•	Used to store job application target organizations.
	•	If a company is deleted → applications keep historical data (company_id becomes NULL).

job_boards
	•	Platform from which job postings came (LinkedIn, Indeed, etc.)
	•	If deleted → applications keep history (job_board_id becomes NULL).

applications
	•	Core activity table.
	•	Tracks where the user applied, job title, status, timestamps.

tagvalues
	•	Flexible metadata system.
	•	One user can store custom fields such as:
	•	LinkedIn URL
	•	Portfolio URL
	•	About/Bio text
	•	(user_id, tag) must be unique.



### DBML

Table users {
  id uuid [pk]
  username text [unique]
  firstname text
  lastname text
  email text
  password text
}

Table companies {
  id uuid [pk]
  user_id uuid
  name text [unique]
  website text
  location text
  created_at timestamptz
}

Table job_boards {
  id uuid [pk]
  user_id uuid
  name text [unique]
  url text
}

Table applications {
  id uuid [pk]
  user_id uuid
  company_id uuid
  job_board_id uuid
  job_title text
  status text
  applied_at timestamptz
  last_updated timestamptz
}

Table tagvalues {
  id uuid [pk]
  user_id uuid
  tag text
  value text
  type text
  created_at timestamptz
  updated_at timestamptz

  indexes {
    (user_id, tag) [unique]
  }
}

Ref: companies.user_id > users.id
Ref: job_boards.user_id > users.id
Ref: applications.user_id > users.id
Ref: applications.company_id > companies.id
Ref: applications.job_board_id > job_boards.id
Ref: tagvalues.user_id > users.id