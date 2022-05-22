package it.mconst.cooler.utils

import munit.Assertions
import munit.CatsEffectAssertions.MUnitCatsAssertionsForIOOps

import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.{Encoder, Json}
import io.circe.{Decoder, DecodingFailure, HCursor}
import io.circe.syntax.EncoderOps
import it.mconst.cooler.models.user.{JWT, User}
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.Result._
import org.http4s.{
  AuthScheme,
  Credentials,
  EntityDecoder,
  HttpApp,
  Request,
  Status
}
import org.http4s.circe._
import org.http4s.client.Client
import org.http4s.headers.Authorization

object TestUtils {
  extension [T](io: IO[T]) {
    def debug = io.map { value =>
      println(value)
      value
    }
  }

  extension [T](result: IO[Result[T]]) {
    def orFail(using a: Assertions) =
      result.map(_.fold(error => a.fail(error.message.toString), identity))
  }

  extension (request: Request[IO])(using client: Client[IO]) {
    def sign(authTokens: JWT.AuthTokens): Request[IO] = request.putHeaders(
      Authorization(
        Credentials.Token(AuthScheme.Bearer, authTokens.accessToken)
      )
    )

    def sign(user: User): Request[IO] = sign(JWT.generateAuthTokens(user))

    def shouldRespond[A](expected: A)(using Encoder[A]): IO[Unit] = {
      client.expect[Json](request).assertEquals(expected.asJson)
    }

    def shouldRespondLike[A, B](f: A => B, expected: B)(using
        EntityDecoder[IO, A]
    ): IO[Unit] =
      client.expect[A](request).map(f).assertEquals(expected)
  }

  case class ErrorResponse(status: Status, message: String)

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

  given Decoder[ErrorResponse] with {
    override def apply(c: HCursor): Decoder.Result[ErrorResponse] = {
      for {
        statusCode <- c.downField("status").as[Int]
        status <- Status
          .fromInt(statusCode) match
          case Right(status) => Right(status)
          case Left(_) =>
            Left(
              DecodingFailure(s"Invalid status code: $statusCode", c.history)
            )
        message <- c.downField("message").as[String]
      } yield ErrorResponse(status, message)
    }
  }

  given EntityDecoder[IO, ErrorResponse] = jsonOf[IO, ErrorResponse]
}
