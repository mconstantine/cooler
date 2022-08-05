name := "cooler"
version := "1.0.0"
scalaVersion := "3.1.2"

val http4sVersion = "0.23.11"
val circeVersion = "0.14.1"
val scalaTestVersion = "3.2.12"
val mongo4catsVersion = "0.4.8"

libraryDependencies ++= Seq(
  "com.github.jwt-scala" %% "jwt-circe" % "9.0.5",
  "com.github.pureconfig" %% "pureconfig" % "0.17.1" cross CrossVersion.for3Use2_13,
  "com.github.t3hnar" %% "scala-bcrypt" % "4.3.0" cross CrossVersion.for3Use2_13,
  "com.osinka.i18n" %% "scala-i18n" % "1.0.3" cross CrossVersion.for3Use2_13,
  "io.circe" %% "circe-generic" % circeVersion,
  "io.circe" %% "circe-parser" % circeVersion,
  "io.github.kirill5k" %% "mongo4cats-circe" % mongo4catsVersion,
  "io.github.kirill5k" %% "mongo4cats-core" % mongo4catsVersion,
  "io.github.kirill5k" %% "mongo4cats-embedded" % mongo4catsVersion % Test,
  "org.http4s" %% "http4s-circe" % http4sVersion,
  "org.http4s" %% "http4s-dsl" % http4sVersion,
  "org.http4s" %% "http4s-ember-client" % http4sVersion,
  "org.http4s" %% "http4s-ember-server" % http4sVersion,
  "org.scalameta" %% "munit" % "1.0.0-M6" % Test
)

testFrameworks += new TestFramework("munit.Framework")
