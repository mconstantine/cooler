package it.mconst.cooler

import cats.effect.{ExitCode, IO, IOApp}
import cats.syntax.all._
import com.comcast.ip4s.{Host, Port}
import io.circe.generic.auto.{deriveDecoder, deriveEncoder}
import io.circe.syntax.EncoderOps
import org.http4s.{EntityDecoder, HttpRoutes, HttpApp}
import org.http4s.circe._
import org.http4s.dsl.io._
import org.http4s.ember.server.EmberServerBuilder
import org.http4s.server.Router

object Server extends IOApp {
  case class Hello(greeting: String)
  case class Goodbye(farewell: String)
  case class User(name: String)

  given EntityDecoder[IO, User] = jsonOf[IO, User]
  given EntityDecoder[IO, Hello] = jsonOf[IO, Hello]

  val rootService = HttpRoutes.of[IO] { case GET -> Root =>
    Ok()
  }

  val helloService = HttpRoutes.of[IO] { case GET -> Root / "hello" / name =>
    Ok(Hello(s"Hello, $name").asJson)
  }

  val goodbyeService = HttpRoutes.of[IO] {
    case req @ POST -> Root / "goodbye" =>
      for {
        user <- req.as[User]
        response <- Ok(Goodbye(s"Goodbye ${user.name}").asJson)
      } yield (response)
  }

  val allServices = rootService <+> helloService <+> goodbyeService
  val app = Router("/api" -> allServices).orNotFound

  override def run(args: List[String]) = {
    EmberServerBuilder
      .default[IO]
      .withHost(
        Host
          .fromString(CoolerConfig.server.host) match {
          case Some(host) => host
          case None =>
            throw new IllegalArgumentException(
              "Invalid host in configuration file"
            )
        }
      )
      .withPort(Port.fromInt(CoolerConfig.server.port) match {
        case Some(port) => port
        case None =>
          throw new IllegalArgumentException(
            "Invalid port in configuration file"
          )
      })
      .withHttpApp(app)
      .build
      .use(_ => IO.never)
      .as(ExitCode.Success)
  }
}
