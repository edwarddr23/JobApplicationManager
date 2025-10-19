# API Outline (v1)

## Auth
- POST /auth/register — { username, password, email? }
- POST /auth/login — { username, password } -> token/session
- POST /auth/logout

## Companies / Job Boards
- POST /companies — { name, website?, location? }
- POST /job-boards — { name, url? }
- GET /companies
- GET /job-boards

## Applications (composite key)
- POST /applications — { username, company, job_board, status }  
  (Server resolves names to IDs, inserts into app.applications)
- GET /applications?username=… — list user’s apps (company, job_board, status, applied_at, updated_at)
- PATCH /applications/:username/:company/:jobboard/status — { status }
- DELETE /applications/:username/:company/:jobboard

## Status values
`applied, in_review, oa, phone, onsite, offer, rejected, withdrawn`


cat > docs/api-outline.md <<'EOF'
# API Outline (v1)

## Auth
- POST /auth/register — { username, password, email? }
- POST /auth/login — { username, password } -> token/session
- POST /auth/logout

## Companies / Job Boards
- POST /companies — { name, website?, location? }
- POST /job-boards — { name, url? }
- GET /companies
- GET /job-boards

## Applications (composite key)
- POST /applications — { username, company, job_board, status }  
  (Server resolves names to IDs, inserts into app.applications)
- GET /applications?username=… — list user’s apps (company, job_board, status, applied_at, updated_at)
- PATCH /applications/:username/:company/:jobboard/status — { status }
- DELETE /applications/:username/:company/:jobboard

## Status values
`applied, in_review, oa, phone, onsite, offer, rejected, withdrawn`
