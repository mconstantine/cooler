package it.mconst.cooler

import cats.data.Kleisli
import cats.data.OptionT
import cats.effect.ExitCode
import cats.effect.IO
import cats.effect.IOApp
import cats.syntax.all.none
import com.comcast.ip4s.Host
import com.comcast.ip4s.Port
import fs2.io.file.Path
import it.mconst.cooler.routes.ClientRoutes
import it.mconst.cooler.routes.ProjectRoutes
import it.mconst.cooler.routes.PublicRoutes
import it.mconst.cooler.routes.SessionRoutes
import it.mconst.cooler.routes.TaskRoutes
import it.mconst.cooler.routes.TaxRoutes
import it.mconst.cooler.routes.UserRoutes
import it.mconst.cooler.utils.Config
import it.mconst.cooler.utils.DatabaseName
import org.http4s.dsl.io.*
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.Request
import org.http4s.Response
import org.http4s.server.middleware.CORS
import org.http4s.server.Router
import org.http4s.server.staticcontent.*
import org.http4s.StaticFile

object Server extends IOApp {
  given DatabaseName = Config.database.name

  val router = Router(
    "/" -> PublicRoutes(),
    "/users" -> UserRoutes(),
    "/clients" -> ClientRoutes(),
    "/projects" -> ProjectRoutes(),
    "/tasks" -> TaskRoutes(),
    "/sessions" -> SessionRoutes(),
    "/taxes" -> TaxRoutes()
  )

  val frontEndPath = Config.server.frontendPath
  val indexPath = frontEndPath ++ "/index.html"

  val frontendFiles
      : Kleisli[[T] =>> OptionT[IO, T], Request[IO], Response[IO]] =
    Kleisli((req) =>
      fileService[IO](FileService.Config(frontEndPath))
        .run(req)
        .orElse(StaticFile.fromPath[IO](Path(indexPath), none[Request[IO]]))
    )

  val service = Router(
    "/api" -> router,
    "/" -> frontendFiles
  ).orNotFound

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
