set -a
source .env
set +a

echo "[$APP_NAME]: Starting Docker..."

docker compose up -d

echo "[$APP_NAME]: Updating..."

docker cp ./$APP_NAME-assembly-$APP_VERSION.jar ${APP_NAME}_app:/opt/app
docker cp ./application.production.json ${APP_NAME}_app:src/main/resources/application.json
docker cp ./client ${APP_NAME}_app:./client

docker restart ${APP_NAME}_app
