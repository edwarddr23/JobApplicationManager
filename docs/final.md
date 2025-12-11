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
- Manage cover-letter-related information
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

- Every user, company, job board, application, and profile tag is stored as a properly related row in the database.
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

The UI has more screens, but those screens are **different operations on this same schema**:

- **Quick Draw** runs targeted queries against `applications`.
- **My Profile** reads from `users` plus `tagvalues`.
- **Configure Companies / Configure Job Boards** are CRUD views on `companies` and `job_boards`.
- **Cover Letters** are stored as tag values or profile metadata without needing extra tables.

We only introduce tables when there is a real new data entity.  
That keeps the backend consistent and ready for extensions such as notes, interviews, or analytics.

### 3.2 Clear mapping between UI and database

Every page in the UI maps directly to database work:

- **Login / Create User / Change Password** → operations on `users`
- **My Profile** → `users` + `tagvalues`
- **Configure Companies** → CRUD on `companies`
- **Configure Job Boards** → CRUD on `job_boards`
- **Enter Application** → inserts and updates in `applications`
- **Quick Draw** → filtered queries on `applications`
- **Cover Letters** → metadata in `tagvalues` (e.g., stored templates or links)

This makes the system easier to reason about and easier to demonstrate:  
UI interactions correspond one-to-one with relational updates.

### 3.3 Flexible profile system using TagValues

Instead of adding a new column every time we need more profile information, we use the `tagvalues` table:

- Each row: `(id, user_id, tag, value, type, created_at, updated_at)`
- `(user_id, tag)` is unique, so a user cannot have two “LinkedIn URL” entries.
- `type` distinguishes links from plain text.

This supports evolving needs like:

- LinkedIn URL
- GitHub / portfolio links
- Resume URL
- Short bio
- Custom fields without schema changes

---

## 4. Technical Design

### 4.1 Stack Overview

- **Frontend:** React + TypeScript (Vite)
- **Backend:** Node.js + Express
- **Database:** PostgreSQL
- **Auth:** Session / token-based authentication
- **Dev Environment:** Docker + `docker-compose` for database and services

### 4.2 Database Schema (Logical Design)

We use five tables, all defined in `server/db/init.ts` and documented in `docs/schema.md`:

- **users** — core user accounts and login credentials  
- **companies** — companies users apply to  
- **job_boards** — platforms like LinkedIn, Indeed, or custom sources  
- **applications** — each job application a user submits  
- **tagvalues** — flexible key–value metadata per user

Key constraints:

- All primary keys are UUIDs.
- `users.username`, `companies.name`, and `job_boards.name` are unique.
- Foreign keys:
  - `companies.user_id` → `users.id`
  - `job_boards.user_id` → `users.id`
  - `applications.user_id` → `users.id`
  - `applications.company_id` → `companies.id`
  - `applications.job_board_id` → `job_boards.id`
  - `tagvalues.user_id` → `users.id`
- `(user_id, tag)` is unique in `tagvalues`.

For detailed column-by-column documentation, see:  
[`docs/schema.md`](./schema.md)

### 4.3 ERD (Entity Relationship Diagram)

The ERD (in `docs/erd.md`) visualizes the relationships:

- One **user** → many **companies**
- One **user** → many **job_boards**
- One **user** → many **applications**
- One **user** → many **tagvalues**
- One **company** → many **applications**
- One **job_board** → many **applications**

`applications` sits at the center, connecting users, companies, and job boards.

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

- Node.js (LTS)
- npm or yarn
- Docker + `docker-compose` (if using the Docker setup)

### 6.2 Local Setup (without Docker)

```bash
git clone git@github.com:edwarddr23/JobApplicationManager.git
cd JobApplicationManager

### Backend 
cd server
npm install
npm run dev

### frontend (Frontend usually runs on http://localhost:5000 and backend on http://localhost:3001 (or configured ports).)
cd ../client
npm install
npm run dev

### 6.3 Running with Docker
docker compose down -v
docker compose up --build

### 7. Mapping the UI to the Data Model
	•	Home — entry point / navigation
	•	Login / Create User / Change Password — authentication flows on users
	•	My Profile — combines users and tagvalues for profile display
	•	Configure Companies — CRUD interface over companies
	•	Configure Job Boards — CRUD interface over job_boards
	•	Enter Application — inserts and updates rows in applications
	•	Quick Draw — quick filtering/preview of applications
	•	Cover Letters — driven by tagvalues (e.g., saved links or text)

This direct mapping between pages and tables is what makes the system consistent and explainable.

### 8. Future Extensions

Because the schema is normalized and relationships are explicit, the project can grow in several directions:
	•	Application stages (phone screen, onsite, offer, etc.)
	•	Notes per application
	•	Interview scheduling
	•	Analytics dashboards (conversion rates per company or job board)
	•	Many-to-many tagging for applications