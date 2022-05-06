package it.mconst.cooler

import io.circe.generic.auto._
import io.circe.parser._
import io.circe.syntax._
import java.io.File
import scala.io.Source

object CoolerConfig extends App {
  private def open(path: String) = new File(path)

  extension (file: File) {
    def read() = Source.fromFile(file).getLines().mkString
  }

  case class ServerConfig(
      host: String,
      port: Int
  )

  case class DatabaseConfig(uri: String)

  private case class Config(
      server: ServerConfig,
      database: DatabaseConfig
  )

  private val configContent = open("src/main/resources/application.json").read()

  private val configResult = parse(configContent) match {
    case Right(json) => json.as[Config]
    case Left(error) =>
      throw new IllegalArgumentException(
        s"""Invalid JSON in config file: $error"""
      )
  }

  private val config = configResult match {
    case Right(config) => config
    case Left(error) =>
      throw new IllegalArgumentException(
        s"""Invalid JSON in config file: $error"""
      )
  }

  val server = config.server
  val database = config.database
}
