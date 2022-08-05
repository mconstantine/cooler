#! /bin/bash
# I know nothing about bash, don't judge me :unicorn-face:

echo "Setting environment variables..."

while read -r line;
do
if [[ $line == name* ]]; then
  app_name=`echo $line | awk -F' *:= *' '{print $2}'`
elif [[ $line == version* ]]; then
  app_version=`echo $line | awk -F' *:= *' '{print $2}'`
fi
done < ./server/build.sbt

sed "s/APP_NAME=.*/APP_NAME=$app_name/g" .env > .env.tmp
mv .env.tmp .env
sed "s/APP_VERSION=.*/APP_VERSION=$app_version/g" .env > .env.tmp
mv .env.tmp .env

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
