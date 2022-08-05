#! /bin/bash
# I know nothing about bash, don't judge me :unicorn-face:

set -a
source .env
set +a

echo "[$APP_NAME]: Building client..."

cd client
yarn
yarn build

echo "[$APP_NAME]: Building server..."

cd ../server
sbt assembly

echo "[$APP_NAME]: Starting Docker..."

cd ..
docker compose up -d
