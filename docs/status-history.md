# Status History

## Purpose
Track every status change for an application.

## Table
app.status_history
id (uuid, PK)
user_id (uuid, FK)
company_id (uuid, FK)
job_board_id (uuid, FK)
status (text enum)
note (text)
changed_at (timestamptz)

Foreign key references app.applications(user_id, company_id, job_board_id).

## Endpoints

POST /applications/:username/:company/:jobboard/status-history
Body:
{
  "status": "phone",
  "note": "Recruiter screen scheduled"
}
Response:
201
{ "ok": true }

GET /applications/:username/:company/:jobboard/status-history
Response:
200
[
  { "status": "applied", "note": "Submitted", "changed_at": "..." },
  { "status": "in_review", "note": "HR viewed", "changed_at": "..." }
]

Notes
If preferred, the PATCH /applications/:username/:company/:jobboard/status endpoint can insert into status_history as part of the update.
