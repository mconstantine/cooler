# Cooler

## Environment

### Server

Take a look at the file at `server/src/main/resources/application.json`. All server dev environment is there.

### Client

Everything should be in the file at `client/.env.development`.

## Development and testing

### Containers

You may need to create the volume for the database to save data into: `docker volume create cooler_db`

- Make sure you have the [Docker](https://marketplace.visualstudio.com/items?itemName=ms-azuretools.vscode-docker) and [Dev Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extensions installed
- Run `docker compose -p cooler-dev -f dev.compose.yml up -d`
- Attach VSCode to the `cooler/dev` container. Open the `cooler` folder

#### Server

From inside the container:

- Install the [Metals](https://marketplace.visualstudio.com/items?itemName=scalameta.metals) extension
- Open the file at `server/src/main/scalaServer.scala`
- Wait for Metals to install, click on "Import build" if asked for
- Once Metals is done compiling, you may need to close and reopen the `Server.scala` file. Then you should see some "run | debug" texts right above the `Server object`. Click on "debug" to start the server
- To run all the tests, open the terminal, navigate to `/server` and run "sbt test"

#### Client

From inside the container:

- `cd client`
- `yarn`
- `yarn start`

## Deploy

Create a file at `server/src/main/resources/application.production.json`. Copy the content of `application.json` and fill in the server configuration for production.

Create a file at `client/.env.production`. Copy the content of `.env.development` and fill in the client configuration for production.

Create a file at `.env`. Set the environment variables for production:

```
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=root
```

Update `appName`, `appVersion` and `scalaVersion` inside `compose.yml` if needed, matching the values of `server/build.sbt`.

- `docker compose build`
- `docker push registry.mconst.it/cooler`

From the server:

- `docker compose up -d` (still not sure about how it will sync with changes)
