package it.mconst.cooler.utils

import cats.effect.IO
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.HCursor
import org.http4s.circe._
import org.http4s.{EntityDecoder, Status}

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
}

given EntityDecoder[IO, ErrorResponse] = jsonOf[IO, ErrorResponse]
