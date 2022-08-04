package it.mconst.cooler

import cats.effect.ExitCode
import cats.effect.IO
import cats.effect.IOApp
import com.comcast.ip4s.Host
import com.comcast.ip4s.Port
import it.mconst.cooler.routes.ClientRoutes
import it.mconst.cooler.routes.ProjectRoutes
import it.mconst.cooler.routes.PublicRoutes
import it.mconst.cooler.routes.SessionRoutes
import it.mconst.cooler.routes.TaskRoutes
import it.mconst.cooler.routes.TaxRoutes
import it.mconst.cooler.routes.UserRoutes
import it.mconst.cooler.utils.Config
import org.http4s.dsl.io.*
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.server.middleware.CORS
import org.http4s.server.Router

object Server extends IOApp {
  val router = Router(
    "/" -> PublicRoutes(),
    "/users" -> UserRoutes(),
    "/clients" -> ClientRoutes(),
    "/projects" -> ProjectRoutes(),
    "/tasks" -> TaskRoutes(),
    "/sessions" -> SessionRoutes(),
    "/taxes" -> TaxRoutes()
  )

  val service = Router("/api" -> router).orNotFound

  val app = Config.environment match
    case "development" => CORS(service)
    case "production"  => service
    case _ =>
      throw new IllegalArgumentException(
        "environment in configuration file must be either \"development\" or \"production\""
      )

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
      .withErrorHandler { error =>
        Config.environment match
          case "development" => println(error)
          case "production"  => ()
          case _ =>
            throw new IllegalArgumentException(
              "environment in configuration file must be either \"development\" or \"production\""
            )

        InternalServerError()
      }
      .build
      .use(_ => IO.never)
      .as(ExitCode.Success)
  }
}
