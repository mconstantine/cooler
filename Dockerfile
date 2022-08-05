# syntax=docker/dockerfile:1
FROM ubuntu
ARG APP_NAME
ARG APP_VERSION
RUN apt update
RUN apt install -y default-jre
RUN mkdir -p src/main/resources
COPY ./server/target/scala-3.1.2/${APP_NAME}-assembly-${APP_VERSION}.jar .
COPY ./server/src/main/resources/application.production.json ./src/main/resources/application.json
COPY ./client/build ./client
