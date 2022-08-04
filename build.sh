#! /bin/bash
cd client
yarn
yarn build
cd ../server
sbt assembly
docker compose up -d
