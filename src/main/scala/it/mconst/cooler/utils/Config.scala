package it.mconst.cooler.utils

import io.circe.generic.auto.*
import io.circe.parser.*
import io.circe.syntax.*
import java.io.File
import scala.io.Source

object Config extends App {
  private def open(path: String) = new File(path)

  extension (file: File) {
    def read() = Source.fromFile(file).getLines().mkString
  }

  case class ServerConfig(host: String, port: Int)
  case class DatabaseConfig(uri: String, name: String, encryptionKey: String)

  private case class Config(
      server: ServerConfig,
      database: DatabaseConfig,
      defaultPageSize: Int
  )

  private val configContent = open("src/main/resources/application.json").read()

  private val configResult = parse(configContent)
    .map(_.as[Config])
    .getOrElse(
      throw new IllegalArgumentException(
        s"""Invalid JSON in config file"""
      )
    )

  private val config = configResult.getOrElse(
    throw new IllegalArgumentException(
      s"""Invalid JSON in config file: $configResult"""
    )
  )

  val server = config.server
  val database = config.database
  val defaultPageSize = config.defaultPageSize
}
