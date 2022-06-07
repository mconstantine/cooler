package it.mconst.cooler

import cats.effect.ExitCode
import cats.effect.IO
import cats.effect.IOApp
import com.comcast.ip4s.Host
import com.comcast.ip4s.Port
import it.mconst.cooler.routes.ClientRoutes
import it.mconst.cooler.routes.PublicRoutes
import it.mconst.cooler.routes.UserRoutes
import it.mconst.cooler.utils.Config
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.server.Router

object Server extends IOApp {
  val services = Router(
    "/" -> PublicRoutes(),
    "/users" -> UserRoutes(),
    "/clients" -> ClientRoutes()
  )

  val app = Router("/api" -> services).orNotFound

  override def run(args: List[String]) = {
    EmberServerBuilder
      .default[IO]
      .withHost(
        Host
          .fromString(Config.server.host)
          .getOrElse(
            throw new IllegalArgumentException(
              "Invalid host in configuration file"
            )
          )
      )
      .withPort(
        Port
          .fromInt(Config.server.port)
          .getOrElse(
            throw new IllegalArgumentException(
              "Invalid port in configuration file"
            )
          )
      )
      .withHttpApp(app)
      .build
      .use(_ => IO.never)
      .as(ExitCode.Success)
  }
}
