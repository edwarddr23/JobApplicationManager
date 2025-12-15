# JobApplicationManager — Final Product Page

A full-stack job application manager with a PostgreSQL backend and a React/TypeScript frontend.

---

## 1. Product Overview

JobApplicationManager is a web application that gives users a structured way to manage their job search.

Instead of juggling spreadsheets, notes, and browser tabs, a user can:

- Create an account and log in
- Maintain a personal list of companies
- Maintain a personal list of job boards
- Enter job applications and track their status over time
- Store profile metadata such as LinkedIn URL, portfolio, or bio
- Quickly review applications through a “Quick Draw” view
- Upload and manage cover letters as files linked to the user
- Configure companies and job boards through dedicated screens

Every action in the UI is backed by a relational PostgreSQL database and exposed through an Express API.

---

## 2. Value Proposition

### 2.1 Problem

Most job searches are tracked informally: ad-hoc spreadsheets, email search, messages to self.  
That makes it hard to answer basic questions like:

- Where did I apply last week?
- Which companies have already rejected me?
- Which roles are still pending?
- Which version of my profile or links did I send to which employer?

### 2.2 Our Approach

JobApplicationManager provides a **single, coherent system** for the job search:

- Every user, company, job board, application, profile tag, and cover letter file is stored as a properly related row in the database.
- The UI is organized around clear pages:

  - **Home**
  - **Login**
  - **My Profile**
  - **Create User**
  - **Change Password**
  - **Enter Application**
  - **Quick Draw**
  - **Cover Letters**
  - **Configure Job Boards**
  - **Configure Companies**

- The backend enforces relationships, uniqueness, and referential integrity so data stays consistent as the job search scales.

The result is a controlled, auditable workflow instead of scattered information.

---

## 3. What Differentiates Our Product

### 3.1 Focused, normalized schema

Our database schema is intentionally **focused and normalized** around the true entities of the problem:

- `users`
- `companies`
- `job_boards`
- `applications`
- `tagvalues`
- `cover_letters`

The UI has multiple screens, but those screens are **operations on this same schema**:

- **Quick Draw** runs targeted queries against `applications`.
- **My Profile** reads from `users` plus `tagvalues`.
- **Configure Companies / Configure Job Boards** are CRUD views on `companies` and `job_boards`.
- **Cover Letters** stores uploaded files in `cover_letters` (with the file path stored in the database).

### 3.2 Clear mapping between UI and database

Every page in the UI maps directly to database work:

- **Login / Create User / Change Password** → operations on `users`
- **My Profile** → `users` + `tagvalues`
- **Configure Companies** → CRUD on `companies`
- **Configure Job Boards** → CRUD on `job_boards`
- **Enter Application** → inserts in `applications` (supports selecting an existing company or using `custom_company_name`)
- **Quick Draw** → filtered queries on `applications`
- **Cover Letters** → upload/list/download/delete rows in `cover_letters`

This makes the system easier to explain and demonstrate: UI interactions correspond one-to-one with relational updates.

### 3.3 Flexible profile system using TagValues

Instead of adding a new column every time we need more profile information, we use the `tagvalues` table:

- Each row: `(id, user_id, tag, value, type, created_at, updated_at)`
- `(user_id, tag)` is unique, so a user cannot have duplicate tags.
- `type` distinguishes links from plain text.

This supports evolving profile needs like:

- LinkedIn URL
- GitHub / portfolio links
- Resume URL
- Short bio
- Custom fields without schema changes

---

## 4. Technical Design

### 4.1 Stack Overview

- **Frontend:** React + TypeScript
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Auth:** Token-based authentication (JWT)
- **Dev Environment:** Docker + `docker compose`

### 4.2 Database Schema (Logical Design)

All tables are defined in `server/db/init.ts` and documented in `docs/schema.md`:

- **users** — accounts and login credentials
- **companies** — companies a user tracks (unique per user)
- **job_boards** — job sources a user tracks (unique per user)
- **applications** — submitted applications (linked to user, optionally linked to company and job board)
- **tagvalues** — profile metadata (key–value per user)
- **cover_letters** — uploaded cover letter files per user

Key constraints (as implemented):

- All primary keys are UUIDs.
- `users.username` is unique.
- `companies` has `UNIQUE (user_id, name)` (company names are unique per user, not globally).
- `job_boards` has `UNIQUE (user_id, name)` (job board names are unique per user, not globally).
- Foreign keys:
  - `companies.user_id` → `users.id` (`ON DELETE SET NULL`)
  - `job_boards.user_id` → `users.id` (`ON DELETE SET NULL`)
  - `applications.user_id` → `users.id` (`ON DELETE CASCADE`)
  - `applications.company_id` → `companies.id` (`ON DELETE SET NULL`)
  - `applications.job_board_id` → `job_boards.id` (`ON DELETE SET NULL`)
  - `tagvalues.user_id` → `users.id` (`ON DELETE CASCADE`)
  - `cover_letters.user_id` → `users.id` (`ON DELETE CASCADE`)
- `tagvalues` has `UNIQUE (user_id, tag)`.
- `applications.status` is constrained to: `('applied','offer','rejected','withdrawn')`.
- `applications` supports a manual company name via `custom_company_name`.

For detailed column-by-column documentation, see:  
[`docs/schema.md`](./schema.md)

### 4.3 ERD (Entity Relationship Diagram)

The ERD (in `docs/erd.md`) visualizes:

- One **user** → many **companies**
- One **user** → many **job_boards**
- One **user** → many **applications**
- One **user** → many **tagvalues**
- One **user** → many **cover_letters**
- One **company** → many **applications**
- One **job_board** → many **applications**

`applications` connects users, companies, and job boards.

Full ERD:  
[`docs/erd.md`](./erd.md)

---

## 5. Link to Codebase

GitHub repository:  
**https://github.com/edwarddr23/JobApplicationManager**

Key directories:

- `client/` — React + TypeScript frontend
- `server/` — Node/Express backend (routes, auth, database access)
- `docs/` — schema, ERD, devlog, and final documentation

---

## 6. User Guide

### 6.1 Prerequisites

- Docker + Docker Compose

### 6.2 Running with Docker

```bash
docker compose down -v
docker compose up --build