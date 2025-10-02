# Important for development

Note that each of these directories hold its own docker container. There are 3 containers for this fullstack application: db, client, and server. These can be all run at once using the docker-cmpose.yml at the project root. To run this project as a whole (in dev that is, as it is only configured to dev right now), run:

**docker-compose build**
**docker-compose run**

Then it should start running.

Environment variables are shared using the .env file at the project root. The docker-compose.yml references this .env file.

The server uses ts-node-dev for hot reload, so on save, it will recompile, and the changes will be seen on the browser on manual reload.

The client's hot reload also works in docker container.

Building and running the client docker image is a little slow on windows, so if you want, you can develop manually without docker using:
**npm run start**
However, you must test changes in docker to make sure it works between platforms. Docker compatibility must be tested as our development platforms are likely not the same (I develop on Linux). Also, this is best practice in case we need to present on a different system for presentations.
