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

echo "[$APP_NAME]: Cleaning up..."

rm -rf build

echo "[$APP_NAME]: Cloning the repository..."

git clone $GIT_URL build

echo "[$APP_NAME]: Copying files..."

cp ./client/.env.production ./build/client/.env.production
cp ./server/src/main/resources/application.production.json ./build/server/src/main/resources/application.production.json
cp ./.env ./build/.env
rm -rf ./build/.git

echo "[$APP_NAME]: Done! Now you can move the build folder to the server, run the build.sh script, then delete it from everywhere until the next deploy."
