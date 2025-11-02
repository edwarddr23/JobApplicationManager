curl -X POST http://localhost:5000/login \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "password123"}'
____________________________________________________________________________

curl -X POST http://localhost:5000/logout \
  -H "Content-Type: application/json"
____________________________________________________________________________

"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZGIwYTFiOS04NzIzLTRlNDAtOTVjNC1lNTljOTFkODljOTYiLCJpYXQiOjE3NjIwMzMzMDgsImV4cCI6MTc2MjAzNjkwOH0.EOUd5TVkiGD41UAaMhM_qn4IWYyXTIVy_RalYJbrKVM"
____________________________________________________________________________

curl -X GET http://localhost:5000/applications \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjMTgzOWU2Yy04MzhjLTRiOGMtYTJlNi03NDIzMjMyNGU5MjEiLCJpYXQiOjE3NjIwMzA1MzEsImV4cCI6MTc2MjAzNDEzMX0.r11WXY3-uhYdXygI7NRn877wRAJksAi7tQR4DGlgi0Q" \
-H "Content-Type: application/json"
____________________________________________________________________________

curl -X GET http://localhost:5000/companies \
-H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZGIwYTFiOS04NzIzLTRlNDAtOTVjNC1lNTljOTFkODljOTYiLCJpYXQiOjE3NjIwMzMzMDgsImV4cCI6MTc2MjAzNjkwOH0.EOUd5TVkiGD41UAaMhM_qn4IWYyXTIVy_RalYJbrKVM" \
-H "Content-Type: application/json"
____________________________________________________________________________

curl -X POST http://localhost:5000/company \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZGIwYTFiOS04NzIzLTRlNDAtOTVjNC1lNTljOTFkODljOTYiLCJpYXQiOjE3NjIwMzA5MjUsImV4cCI6MTc2MjAzNDUyNX0.nI86s3qe8yvEw3iUamn1nkCGc0byMJ3qfZc46W1aEk0" \
  -H "Content-Type: application/json" \
  -d '{"name": "Sony"}'
____________________________________________________________________________

curl -X DELETE http://localhost:5000/companies/799c6747-9cfb-4be4-ba52-727266b7a9c1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5M2U3MTU4Mi1jN2U2LTQyMzAtOGYxNy0zOGY5YmFjNGJiNzYiLCJpYXQiOjE3NjIwMzI5NzIsImV4cCI6MTc2MjAzNjU3Mn0.meFxo4RJA8D2DKzRqn7GyT2IDp3MUX3u-TW5R3AoDBQ"\
  -H "Content-Type: application/json"
____________________________________________________________________________

curl -X PUT http://localhost:5000/companies/<COMPANY_ID> \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "New Company Name",
        "website": "https://newwebsite.com",
        "location": "New Location"
      }'
____________________________________________________________________________

curl -X PUT http://localhost:5000/companies/799c6747-9cfb-4be4-ba52-727266b7a9c1 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwZGIwYTFiOS04NzIzLTRlNDAtOTVjNC1lNTljOTFkODljOTYiLCJpYXQiOjE3NjIwMzMzMDgsImV4cCI6MTc2MjAzNjkwOH0.EOUd5TVkiGD41UAaMhM_qn4IWYyXTIVy_RalYJbrKVM" \
  -H "Content-Type: application/json" \
  -d '{
        "website": "https://newwebsite.com",
        "location": "New Location"
      }'

