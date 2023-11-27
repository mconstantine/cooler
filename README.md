# Cooler

## Environment

### Server

Take a look at the file at `server/src/main/resources/application.json`. All server dev environment is there.

### Client

Everything should be in the file at `client/.env.development`.

## Development and testing

### Containers

- Database only (for wirking on back-end): `docker compose -p cooler -f dev.compose.yml up mongodb -d`
- Database and back-end (for working on front-end): `docker compose -p cooler -f dev.compose.yml up -d`

You may need to create the volume for the database to save data into: `docker volume create cooler_db`

### Server

Use Metals or SBT commands.

### Client

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
