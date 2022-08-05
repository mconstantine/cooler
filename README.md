# Cooler

## Environment

### Server

Take a look at the file at `server/src/main/resources/application.json`. All server dev environment is there.

### Client

Everything should be in the file at `client/.env.development`.

## Development

### Docker

Run `docker compose -f docker-compose.dev.yml up -d`.

### Server

Use Metals.

### Client

- `yarn`
- `yarn start`

## Deploy

Create a file at `server/src/main/resources/application.production.json`. Copy the content of `application.json` and fill in the server configuration for production.

Create a file at `client/.env.production`. Copy the content of `.env.development` and fill in the client configuration for production.

Create a file at `.env`. Set the environment variables for production:

```
MONGO_USERNAME=
MONGO_PASSWORD=
GIT_URL=
APP_NAME=
APP_VERSION=
```

> You can leave `APP_NAME` and `APP_VERSION` empty (i.e.: with nothing following the equal sign). The build script will take care of it.

Run `./build.sh`.
