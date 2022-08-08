#! /bin/bash
# I know nothing about bash, don't judge me :unicorn-face:

echo "Setting environment variables..."

while read -r line;
do
if [[ $line == name* ]]; then
  app_name=`echo $line | awk -F' *:= *' '{print $2}'`
elif [[ $line == version* ]]; then
  app_version=`echo $line | awk -F' *:= *' '{print $2}'`
elif [[ $line == scalaVersion* ]]; then
  scala_version=`echo $line | awk -F' *:= *' '{print $2}'`
fi
done < ./server/build.sbt

temp="${scala_version%\"}"
temp="${temp#\"}"
scala_version="$temp"

sed "s/APP_NAME=.*/APP_NAME=$app_name/g" .env > .env.tmp
mv .env.tmp .env
sed "s/APP_VERSION=.*/APP_VERSION=$app_version/g" .env > .env.tmp
mv .env.tmp .env

set -a
source .env
set +a

echo "[$APP_NAME]: Testing server..."

cd server
sbt test
cd ..

echo "[$APP_NAME]: Building client..."

cd client
yarn
yarn build
cd ..

echo "[$APP_NAME]: Building server..."

cd server
sbt assembly
cd ..

echo "[$APP_NAME]: Copying files..."

rm -rf build
mkdir build
cp .env build
cp server/src/main/resources/application.production.json build

cp -r client/build build
mv build/build build/client

cp server/target/scala-$scala_version/$APP_NAME-assembly-$APP_VERSION.jar build
cp Dockerfile build
cp docker-compose.yml build

cp install.sh build

echo "[$APP_NAME]: Build is ready: move the content of the build folder into the server and run \`install.sh\`"
