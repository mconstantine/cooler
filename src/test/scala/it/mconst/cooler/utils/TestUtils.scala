package it.mconst.cooler.utils

import munit.Assertions

import cats.data.EitherT
import cats.effect.IO
import cats.Functor
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.HCursor
import io.circe.Json
import io.circe.syntax.EncoderOps
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.BusinessClient
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.PrivateClient
import it.mconst.cooler.models.project.Project
import it.mconst.cooler.models.project.ProjectCashData
import it.mconst.cooler.models.session.Session
import it.mconst.cooler.models.task.Task
import it.mconst.cooler.models.tax.Tax
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.Error
import java.time.format.DateTimeFormatter
import java.time.LocalDateTime
import mongo4cats.bson.ObjectId
import org.bson.BsonDateTime
import org.http4s.AuthScheme
import org.http4s.circe.*
import org.http4s.client.Client as HttpClient
import org.http4s.Credentials
import org.http4s.EntityDecoder
import org.http4s.headers.Authorization
import org.http4s.HttpApp
import org.http4s.Request
import org.http4s.Status
import munit.Location

object TestUtils {
  extension [T](io: IO[T]) {
    def debug = io.map { value =>
      println(value)
      value
    }
  }

  extension [F[_]: Functor, T](result: EitherT[F, Error, T]) {
    def orFail(using a: Assertions): F[T] =
      result.fold(
        error =>
          a.fail(
            List(
              List(error.message.toString),
              error.extras.map(_.mkString("; ")).toList
            ).flatten.mkString(" - ")
          ),
        identity
      )
  }

  extension [A](io: IO[A]) {
    def assertEquals[B](
        expected: B,
        clue: => Any = "values are not the same"
    )(using assertions: Assertions)(using Location, B <:< A): IO[Unit] =
      io.flatMap(obtained =>
        IO(assertions.assertEquals(obtained, expected, clue))
      )
  }

  extension [E, R](result: EitherT[IO, E, R]) {
    def assertEquals(expected: Either[E, R])(using Assertions): IO[Unit] =
      expected match
        case Left(e)  => result.value.assertEquals(Left[E, R](e))
        case Right(r) => result.value.assertEquals(Right[E, R](r))
  }

  extension (request: Request[IO])(using client: HttpClient[IO]) {
    def sign(authTokens: JWT.AuthTokens): Request[IO] = request.putHeaders(
      Authorization(
        Credentials.Token(AuthScheme.Bearer, authTokens.accessToken)
      )
    )

    def sign(user: User): Request[IO] = sign(JWT.generateAuthTokens(user))

    def shouldRespond[A](
        expected: A
    )(using Encoder[A], Assertions): IO[Unit] = {
      client.expect[Json](request).assertEquals(expected.asJson)
    }

    def shouldRespondLike[A, B](f: A => B, expected: B)(using
        EntityDecoder[IO, A],
        Assertions
    ): IO[Unit] =
      client.expect[A](request).map(f).assertEquals(expected)
  }

  case class ErrorResponse(status: Status, message: String)

  extension (app: HttpApp[IO]) {
    def assertError(request: Request[IO], status: Status, message: __)(using
        Lang,
        Assertions
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
  ) = Client.PrivateInputData(
    "PRIVATE",
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
  ) = Client.BusinessInputData(
    "BUSINESS",
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

  extension (client: Client) {
    def asPrivate(using a: Assertions): PrivateClient = client match
      case c: PrivateClient => c
      case _: BusinessClient =>
        a.fail("Trying to cast business client to private client")

    def asBusiness(using a: Assertions): BusinessClient = client match
      case c: BusinessClient => c
      case _: PrivateClient =>
        a.fail("Trying to cast private client to business client")
  }

  def makeTestProject(
      client: ObjectId,
      name: String = "Test project",
      description: Option[String] = none[String],
      expectedBudget: Option[Float] = none[Float],
      cashData: Option[ProjectCashData] = none[ProjectCashData]
  ) = Project.InputData(
    client.toHexString,
    name,
    description,
    expectedBudget,
    cashData
  )

  def makeTestTask(
      project: ObjectId,
      name: String = "Test task",
      description: Option[String] = none[String],
      startTime: String = BsonDateTime(System.currentTimeMillis).toISOString,
      expectedWorkingHours: Float = 1f,
      hourlyCost: Float = 1f
  ) = Task.InputData(
    project.toHexString,
    name,
    description,
    startTime,
    expectedWorkingHours,
    hourlyCost
  )

  def makeTestSession(
      task: ObjectId,
      startTime: Option[String] = Some(
        BsonDateTime(System.currentTimeMillis).toISOString
      ),
      endTime: Option[String] = none[String]
  ) = Session.InputData(task.toHexString, startTime, endTime)

  def makeTestTax(
      label: String = "Tax label",
      value: BigDecimal = 0.42
  ) = Tax.InputData(label, value)
}
