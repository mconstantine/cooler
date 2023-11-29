# syntax=docker/dockerfile:1

FROM ubuntu:latest as development-environment

ARG appName="cooler"
ARG appVersion="1.0.0"
ARG scalaVersion="3.3.1"

WORKDIR /cooler

# Setup

## Backend

### Scala

RUN apt-get update
RUN apt-get install apt-transport-https curl gnupg -y
RUN echo "deb https://repo.scala-sbt.org/scalasbt/debian all main" | tee /etc/apt/sources.list.d/sbt.list
RUN echo "deb https://repo.scala-sbt.org/scalasbt/debian /" | tee /etc/apt/sources.list.d/sbt_old.list
RUN curl -sL "https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x2EE0EA64E40A89B84B2DF73499E82A75642AC823" | gpg --no-default-keyring --keyring gnupg-ring:/etc/apt/trusted.gpg.d/scalasbt-release.gpg --import
RUN chmod 644 /etc/apt/trusted.gpg.d/scalasbt-release.gpg
RUN apt-get update
RUN apt-get install sbt -y

### Java

RUN apt-get install default-jre -y

# Front-end

## Node

RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_16.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install nodejs -y
RUN corepack enable

RUN git clone https://github.com/mconstantine/cooler.git .

EXPOSE 5000
EXPOSE 3000

FROM development-environment AS deploy

# Build

## Backend

ARG serverConfigPath="./server/src/main/resources/application.json"

RUN mkdir -p src/main/resources
RUN cp ${serverConfigPath} src/main/resources/application.json
RUN cd server && sbt assembly
RUN mv "server/target/scala-${scalaVersion}/${appName}-assembly-${appVersion}.jar" server.jar

## Front-end

RUN cd client && yarn
RUN cd client && yarn build
RUN mv client/build static

# Cleanup

## Backend

RUN rm -rf server
RUN apt-get remove sbt -y
RUN apt-get purge sbt -y
RUN apt-get autoremove -y

## Front-end

RUN rm -rf client
RUN apt-get remove nodejs -y
RUN apt-get purge nodejs -y
RUN apt-get autoremove -y
