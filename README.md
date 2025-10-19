# Job Application Manager

This branch adds Dockerized PostgreSQL + server + client setup and a core ERD + API outline.

## Run locally
docker compose up -d
docker exec -i jobtracker_db psql -U postgres -d appdb < db/init/002_schema.sql

Client: http://localhost:5173  
API: http://localhost:3000  

## Docs
ERD (Mermaid): docs/erd.md  
API outline: docs/api-outline.md  

## Schema Overview
users  
companies  
job_boards  
applications (composite PK: user_id, company_id, job_board_id)

## Notes
applications.status stores current state; updated_at updates on change.  
Add status_history table later for per-status timestamps.
