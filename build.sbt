name := "cooler-server"
version := "0.1.0-SNAPSHOT"
scalaVersion := "3.1.2"

val http4sVersion = "0.23.11"
val circeVersion = "0.14.1"
val scalaTestVersion = "3.2.12"

libraryDependencies ++= Seq(
  "com.github.pureconfig" %% "pureconfig" % "0.17.1" cross CrossVersion.for3Use2_13,
  "io.circe" %% "circe-generic" % circeVersion,
  "io.circe" %% "circe-parser" % circeVersion,
  "org.http4s" %% "http4s-circe" % http4sVersion,
  "org.http4s" %% "http4s-dsl" % http4sVersion,
  "org.http4s" %% "http4s-ember-client" % http4sVersion,
  "org.http4s" %% "http4s-ember-server" % http4sVersion,
  "org.scalactic" %% "scalactic" % scalaTestVersion,
  "org.scalatest" %% "scalatest" % scalaTestVersion % "test"
)
