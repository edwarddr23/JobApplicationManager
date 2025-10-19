# Job Application Tracker — PoC

Dockerized stack:
- **db**: PostgreSQL 16
- **server**: Node/Express API
- **client**: React (Vite) served by Nginx

## Run
    docker compose up -d

Open:
- Client: http://localhost:5173
- API:    http://localhost:3000

## API
- GET /healthz
- GET /names
- POST /names   body: {"full_name":"Sathwik"}

## DB
Connect inside container:
    docker exec -it jobtracker_db psql -U postgres -d appdb
Then:
    SELECT * FROM app.names;
