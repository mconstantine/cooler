package it.mconst.cooler.utils

import munit.CatsEffectAssertions.MUnitCatsAssertionsForIOOps

import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.HCursor
import org.http4s.{EntityDecoder, Status}
import org.http4s.{HttpApp, Request}
import org.http4s.circe._

case class ErrorResponse(status: Status, message: String)

given Decoder[ErrorResponse] with {
  override def apply(c: HCursor): Decoder.Result[ErrorResponse] = {
    for {
      statusCode <- c.downField("status").as[Int]
      status <- Status
        .fromInt(statusCode) match
        case Right(status) => Right(status)
        case Left(_) =>
          Left(DecodingFailure(s"Invalid status code: $statusCode", c.history))
      message <- c.downField("message").as[String]
    } yield ErrorResponse(status, message)
  }

  extension (app: HttpApp[IO]) {
    def assertError(request: Request[IO], status: Status, message: __)(using
        Lang
    ): IO[Unit] =
      for
        response <- app.run(request)
        _ <- IO(response.status).assertEquals(status)
        _ <- response
          .as[ErrorResponse]
          .map(error => (error.status, error.message))
          .assertEquals(
            (status, Translations.t(message).toString)
          )
      yield ()
  }
}

given EntityDecoder[IO, ErrorResponse] = jsonOf[IO, ErrorResponse]
