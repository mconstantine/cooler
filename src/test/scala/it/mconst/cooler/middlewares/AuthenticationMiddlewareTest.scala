package it.mconst.cooler.middlewares

import org.scalatest._
import matchers._
import flatspec._

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.effect.unsafe.implicits.global
import cats.syntax.all._
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.{User, Users}
import it.mconst.cooler.utils.{__, ErrorResponse, Translations}
import it.mconst.cooler.utils.given
import org.http4s.{
  AuthedRoutes,
  AuthScheme,
  Credentials,
  Headers,
  HttpApp,
  HttpRoutes,
  Request,
  Response
}
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.io._
import org.http4s.headers.Authorization
import org.http4s.implicits._

class CoolerAuthMiddlewareTest extends AnyFlatSpec with should.Matchers {
  given Lang = Lang.Default

  val publicRoutes: HttpRoutes[IO] = HttpRoutes.of[IO] { case GET -> Root =>
    Ok("Public")
  }

  val authedRoutes: AuthedRoutes[User, IO] =
    AuthedRoutes.of { case GET -> Root / "me" as user =>
      Ok(s"Welcome, ${user.name}")
    }

  val service: HttpRoutes[IO] =
    publicRoutes <+> AuthenticationMiddleware(authedRoutes)

  val app: HttpApp[IO] = service.orNotFound
  val client = Client.fromHttpApp(app)

  it should "always respond to public routes" in {
    val request = GET(uri"/")
    val response = client.expect[String](request).unsafeRunSync()

    response shouldBe "Public"
  }

  it should "work with authorized user" in {
    val userData = User.CreationData(
      name = "John Doe",
      email = "john.doe@example.com",
      password = "Abc123?!"
    )

    val login =
      for
        user <- {
          given Option[User] = None
          Users.register(userData)
        }
        login <- user match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            Users.login(User.LoginData(user.email, userData.password))
      yield (login)

    val authTokens = login.unsafeRunSync() match
      case Left(error)       => fail(error.toString)
      case Right(authTokens) => authTokens

    val request = GET(uri"/me").putHeaders(
      Authorization(
        Credentials.Token(AuthScheme.Bearer, authTokens.accessToken)
      )
    )

    val response = client.expect[String](request).unsafeRunSync()
    response shouldBe s"Welcome, ${userData.name}"

    Users.collection.use(_.drop).unsafeRunSync()
  }

  it should "return 403 if auth header is missing" in {
    val request = GET(uri"/me")
    val response = app.run(request).unsafeRunSync()
    val status = response.status

    status shouldEqual Forbidden

    val body = response.as[ErrorResponse].unsafeRunSync()

    body.status shouldEqual Forbidden
    body.message shouldBe Translations.t(__.ErrorInvalidAccessToken).toString
  }

  it should "return 403 if the token is invalid" in {
    val request = GET(uri"/me").putHeaders(
      Authorization(
        Credentials.Token(AuthScheme.Bearer, "invalid-token")
      )
    )

    val response = app.run(request).unsafeRunSync()
    val status = response.status

    status shouldEqual Forbidden

    val body = response.as[ErrorResponse].unsafeRunSync()

    body.status shouldEqual Forbidden
    body.message shouldBe Translations.t(__.ErrorInvalidAccessToken).toString
  }
}
