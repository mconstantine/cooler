package it.mconst.cooler

import pureconfig.ConfigSource
import pureconfig._

object CoolerConfig {
  case class Port(number: Int) extends AnyVal

  case class ServerConfig(
      host: String,
      port: Port
  )

  given ConfigReader[Port] = ConfigReader[Int].map(Port(_))

  given ConfigReader[ServerConfig] =
    ConfigReader.forProduct2("host", "port")(ServerConfig(_, _))

  val serverConfig = ConfigSource.default.at("server").loadOrThrow[ServerConfig]
}
