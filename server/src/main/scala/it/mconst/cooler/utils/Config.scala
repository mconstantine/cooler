package it.mconst.cooler.utils

import io.circe.Decoder
import io.circe.Encoder
import io.circe.generic.auto.*
import io.circe.parser.*
import io.circe.syntax.*
import java.io.File
import scala.io.Source

opaque type DatabaseName = String

object DatabaseName {
  given Encoder[DatabaseName] = Encoder.encodeString
  given Decoder[DatabaseName] = Decoder.decodeString
}

extension (dbName: DatabaseName) {
  def toString: String = dbName
}

object Config {
  private def open(path: String) = new File(path)

  extension (file: File) {
    def read() = Source.fromFile(file).getLines().mkString
  }

  final case class ServerConfig(host: String, port: Int)

  final case class DatabaseConfig(
      uri: String,
      name: DatabaseName,
      testName: DatabaseName,
      encryptionKey: String
  )

  private final case class Config(
      environment: String,
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

  val environment = config.environment
  val server = config.server
  val database = config.database
  val defaultPageSize = config.defaultPageSize
}
