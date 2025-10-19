# API Use Cases and REST Mappings

## Scope
Core entities: users, companies, job_boards, applications.
Current status is stored on applications. Status history can be added later.

## Status values
applied, in_review, oa, phone, onsite, offer, rejected, withdrawn

## MVP Use Cases
1. Register a new user
2. Log in a user and obtain a token
3. Log out a user
4. Create or upsert a company
5. Create or upsert a job board
6. Create an application for a user to a company sourced from a job board
7. List a user’s applications
8. Update the status of an application
9. Get allowed status list
10. Health check for deployment

## Later Use Cases
A. Delete an application
B. Update application fields other than status
C. List companies and job boards with filters and pagination
D. Add status history per change
E. Attach notes and documents to applications
F. Admin: list users, lock user, reset password
G. Bulk import applications from CSV

## REST Mappings

| Use Case | Method | Path | Notes |
|---|---|---|---|
| Register | POST | /auth/register | body: username, password, email |
| Login | POST | /auth/login | body: username, password |
| Logout | POST | /auth/logout | requires auth |
| Health | GET | /healthz | returns ok:true |
| Create company | POST | /companies | body: name, website?, location? |
| List companies | GET | /companies | later: pagination |
| Create job board | POST | /job-boards | body: name, url? |
| List job boards | GET | /job-boards | later: pagination |
| Create application | POST | /applications | body: username, company, job_board, status? default applied |
| List user applications | GET | /applications?username=demo | supports sort and pagination |
| Update application status | PATCH | /applications/:username/:company/:jobboard/status | body: status |
| Allowed statuses | GET | /statuses | returns enum list |
| Delete application (later) | DELETE | /applications/:username/:company/:jobboard | soft or hard delete |
