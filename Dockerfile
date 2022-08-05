# syntax=docker/dockerfile:1
FROM eclipse-temurin:latest
ARG APP_NAME
ARG APP_VERSION
ARG SCALA_VERSION
RUN mkdir -p /opt/app
RUN mkdir -p src/main/resources
COPY ./${APP_NAME}-assembly-${APP_VERSION}.jar /opt/app
COPY ./application.production.json src/main/resources/application.json
COPY ./client ./client
