package it.mconst.cooler.utils

import munit.Assertions
import munit.CatsEffectAssertions.MUnitCatsAssertionsForIOOps

import cats.data.EitherT
import cats.effect.IO
import cats.Functor
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.HCursor
import io.circe.Json
import io.circe.syntax.EncoderOps
import it.mconst.cooler.models.Client
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.Error
import org.http4s.AuthScheme
import org.http4s.circe.*
import org.http4s.client.Client as HttpClient
import org.http4s.Credentials
import org.http4s.EntityDecoder
import org.http4s.headers.Authorization
import org.http4s.HttpApp
import org.http4s.Request
import org.http4s.Status

object TestUtils {
  extension [T](io: IO[T]) {
    def debug = io.map { value =>
      println(value)
      value
    }
  }

  extension [F[_]: Functor, T](result: EitherT[F, Error, T]) {
    def orFail(using a: Assertions): F[T] =
      result.fold(error => a.fail(error.message.toString), identity)
  }

  extension [E, R](result: EitherT[IO, E, R]) {
    def assertEquals[B](expected: B) = result.value.assertEquals(expected)
  }

  extension (request: Request[IO])(using client: HttpClient[IO]) {
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

  def makeTestPrivateClient(
      fiscalCode: String = "DOEJHN69A24E012X",
      firstName: String = "John",
      lastName: String = "Doe",
      addressCountry: String = "US",
      addressProvince: String = "EE",
      addressZIP: String = "01234",
      addressCity: String = "New York",
      addressStreet: String = "Main Street",
      addressStreetNumber: Option[String] = Some("42"),
      addressEmail: String = "john.doe@example.com"
  ) = Client.PrivateCreationData(
    fiscalCode,
    firstName,
    lastName,
    addressCountry,
    addressProvince,
    addressZIP,
    addressCity,
    addressStreet,
    addressStreetNumber,
    addressEmail
  )

  def makeTestBusinessClient(
      countryCode: String = "US",
      businessName: String = "ACNE Inc.",
      vatNumber: String = "012345678901",
      addressCountry: String = "US",
      addressProvince: String = "EE",
      addressZIP: String = "01234",
      addressCity: String = "New York",
      addressStreet: String = "Main Street",
      addressStreetNumber: Option[String] = Some("42"),
      addressEmail: String = "john.doe@example.com"
  ) = Client.BusinessCreationData(
    countryCode,
    businessName,
    vatNumber,
    addressCountry,
    addressProvince,
    addressZIP,
    addressCity,
    addressStreet,
    addressStreetNumber,
    addressEmail
  )
}
