# JobApplicationManager — ERD (Entity Relationship Diagram)

This ERD describes the actual database schema implemented in `server/db/init.ts`.

---

## 1. Entities & Relationships

### **users**
- id (PK, uuid)
- username (unique)
- firstname
- lastname
- email
- password

### **companies**
- id (PK, uuid)
- user_id (FK → users.id, ON DELETE SET NULL)
- name (unique)
- website
- location
- created_at

### **job_boards**
- id (PK, uuid)
- user_id (FK → users.id, ON DELETE SET NULL)
- name (unique)
- url

### **applications**
- id (PK, uuid)
- user_id (FK → users.id, ON DELETE CASCADE)
- company_id (FK → companies.id, ON DELETE SET NULL)
- job_board_id (FK → job_boards.id, ON DELETE SET NULL)
- job_title
- status (applied, offer, rejected, withdrawn)
- applied_at
- last_updated

### **tagvalues**
- id (PK, uuid)
- user_id (FK → users.id, ON DELETE CASCADE)
- tag
- value
- type (link \| text)
- created_at
- updated_at
- UNIQUE (user_id, tag)

---

## 2. Relationship Diagram (Text-Based)

users  
 ├──< companies        (1 user   → many companies)  
 ├──< job_boards       (1 user   → many job boards)  
 ├──< applications     (1 user   → many applications)  
 └──< tagvalues        (1 user   → many tagvalues)  

companies  
 └──< applications     (1 company → many applications)  

job_boards  
 └──< applications     (1 job board → many applications)  

Explanation symbols:  
- `──<` means "one-to-many" (left = parent, right = children)

---

## 3. DBML Version (for dbdiagram.io or other ERD tools)

```dbml
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