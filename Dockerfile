# syntax=docker/dockerfile:1

FROM ubuntu:latest as development-environment

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

RUN apt-get install default-jdk -y

# Front-end

## Node

RUN mkdir -p /etc/apt/keyrings
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
RUN echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_16.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list
RUN apt-get update
RUN apt-get install nodejs -y
RUN corepack enable

# COPY server server
# COPY client client
RUN git clone https://github.com/mconstantine/cooler.git .

EXPOSE 5000
EXPOSE 3000
EXPOSE 6006

FROM development-environment AS build

# Build

## Backend

RUN cd server && sbt compile
RUN cd server && sbt assembly
# RUN mv "" server.jar

## Front-end

RUN cd client && yarn
RUN cd client && yarn build

FROM ubuntu:latest

WORKDIR /cooler

ARG serverConfigPath="server/src/main/resources/application.json"
ARG appName="cooler"
ARG appVersion="1.0.0"
ARG scalaVersion="3.3.1"

COPY ${serverConfigPath} src/main/resources/application.json
COPY --from=build cooler/server/target/scala-${scalaVersion}/${appName}-assembly-${appVersion}.jar server.jar
COPY --from=build cooler/client/build static

RUN apt-get update
RUN apt-get install default-jre -y

CMD java -jar server.jar
