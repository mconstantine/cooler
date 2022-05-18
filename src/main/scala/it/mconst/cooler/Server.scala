package it.mconst.cooler

import cats.effect.{ExitCode, IO, IOApp}
import cats.syntax.all._
import com.comcast.ip4s.{Host, Port}
import com.osinka.i18n.Lang
import io.circe.generic.auto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.EncoderOps
import it.mconst.cooler.middlewares.{LanguageMiddleware, LanguageRoutes}
import it.mconst.cooler.models.user._
import it.mconst.cooler.utils.{Config, Error}
import it.mconst.cooler.utils.given
import org.http4s.{EntityDecoder, HttpRoutes, HttpApp}
import org.http4s.{EntityEncoder, Response}
import org.http4s.dsl.io._
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.server.Router

def toResponse[T](result: Either[Error, T])(using
    we: EntityEncoder[IO, Error],
    wr: EntityEncoder[IO, T]
): IO[Response[IO]] = result match
  case Right(value) => Ok.apply(wr.toEntity(value).body)
  case Left(error) =>
    IO.pure(Response(status = error.status, body = we.toEntity(error).body))

object Server extends IOApp {
  val publicRoutes: LanguageRoutes[IO] = {
    LanguageRoutes.of { case ctxReq @ POST -> Root / "login" as lang =>
      given Lang = lang

      for
        context <- ctxReq.req.as[User.LoginData]
        result <- Users.login(context)
        response <- toResponse(result)
      yield response
    }
  }

  val allServices = LanguageMiddleware(publicRoutes)
  val app = Router("/api" -> allServices).orNotFound

  override def run(args: List[String]) = {
    EmberServerBuilder
      .default[IO]
      .withHost(
        Host
          .fromString(Config.server.host) match
          case Some(host) => host
          case None =>
            throw new IllegalArgumentException(
              "Invalid host in configuration file"
            )
      )
      .withPort(Port.fromInt(Config.server.port) match
        case Some(port) => port
        case None =>
          throw new IllegalArgumentException(
            "Invalid port in configuration file"
          )
      )
      .withHttpApp(app)
      .build
      .use(_ => IO.never)
      .as(ExitCode.Success)
  }
}
