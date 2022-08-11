# Cooler

## Environment

### Server

Take a look at the file at `server/src/main/resources/application.json`. All server dev environment is there.

### Client

Everything should be in the file at `client/.env.development`.

## Development

### Docker

- Run `sudo chmod +x ./*.sh`
- Run `docker compose -f docker-compose.dev.yml up -d`

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
MONGO_USERNAME=root
MONGO_PASSWORD=root
SSH_URI=user@host
SERVER_URI=/home/user/path/to/directory
APP_NAME=
APP_VERSION=
```

> You can leave `APP_NAME` and `APP_VERSION` empty (i.e.: with nothing following the equal sign). The build script will take care of it.

- Make sure that you have the local database up (e.g.: Docker) so the server tests can run
- Make sure you have the SSH key added, otherwise the build will be useless (it won't break, but it won't deploy anything. It will also delete the build directory so it won't be enough to run the deploy again, you will have to build again)
- Run `./build.sh`
- Run `./deploy.sh`
