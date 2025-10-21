# Important for development

Note that each of these directories hold its own docker container. There are 3 containers for this fullstack application: db, client, and server. These can be all run at once using the docker-cmpose.yml at the project root. To run this project as a whole (in dev that is, as it is only configured to dev right now), run:

### `docker compose build`
### `docker compose run up`

Then it should start running.

Environment variables are shared using the .env file at the project root. The docker-compose.yml references this .env file.

The server uses ts-node-dev for hot reload, so on save, it will recompile, and the changes will be seen on the browser on manual reload.

The client's hot reload also works in docker container.

Building and running the client docker image is a little slow on windows, so if you want, you can develop manually without docker using:

### `npm run start`

However, you must test changes in docker to make sure it works between platforms. Docker compatibility must be tested as our development platforms are likely not the same (I develop on Linux). Also, this is best practice in case we need to present on a different system for presentations.


---

## Quick Start for Local Verification

Run all containers:

docker compose up -d
docker compose ps

Server: http://localhost:3002
Client: http://localhost:5175

## Temporary Auth Setup (no login route yet)

Generate a 2-hour JWT for user bob:

docker exec -it job-tracker-server-1 node -e "
  const jwt=require('jsonwebtoken');
  const s=process.env.JWT_SECRET || 'dev-local-jwt';
  const uid='4f75dd24-57cf-4aaa-9349-fb2a656153f0';
  console.log(jwt.sign({ userId: uid, username:'bob' }, s, { expiresIn:'2h' }));
"

In the browser DevTools console at http://localhost:5175:

localStorage.setItem('username', 'bob');
localStorage.setItem('token', 'PASTE_TOKEN_HERE');
location.reload();

## API Verification

curl -s http://localhost:3002/companies | jq .
curl -s http://localhost:3002/job-boards | jq .
curl -s -H "Authorization: Bearer PASTE_TOKEN_HERE" \
  "http://localhost:3002/applications?username=bob" | jq .

Notes:
- Token expires in 2 hours. Mint a new one as needed.
- /companies and /job-boards are public routes.
- /applications needs Authorization: Bearer <token>.
Quick sanity check Tue Oct 21 14:01:35 EDT 2025
