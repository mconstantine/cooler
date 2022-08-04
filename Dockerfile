# syntax=docker/dockerfile:1
FROM ubuntu
RUN apt update
RUN apt install -y default-jre
RUN mkdir -p src/main/resources
COPY ./server/target/scala-3.1.2/cooler-server-assembly-0.1.0-SNAPSHOT.jar .
COPY ./server/src/main/resources/application.json ./src/main/resources/application.json
COPY ./client/build .
