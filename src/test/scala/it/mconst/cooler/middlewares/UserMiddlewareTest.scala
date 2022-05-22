package it.mconst.cooler.middlewares

import munit.CatsEffectSuite
import it.mconst.cooler.utils.TestUtils._

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.effect.unsafe.implicits.global
import cats.syntax.all._
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware._
import it.mconst.cooler.models.user.{JWT, User, Users}
import it.mconst.cooler.utils.{__, Translations}
import it.mconst.cooler.utils.given
import org.http4s.{AuthedRoutes, HttpApp, HttpRoutes}
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.io._
import org.http4s.implicits._

class UserMiddlewareTest extends CatsEffectSuite {
  given Lang = Lang.Default

  val publicRoutes: HttpRoutes[IO] = HttpRoutes.of[IO] { case GET -> Root =>
    Ok("Public")
  }

  val authedRoutes: AuthedRoutes[UserContext, IO] =
    AuthedRoutes.of { case GET -> Root / "me" as context =>
      Ok(s"Welcome, ${context.user.name}")
    }

  val service: HttpRoutes[IO] =
    publicRoutes <+> UserMiddleware(authedRoutes)

  val app: HttpApp[IO] = service.orNotFound
  val client = Client.fromHttpApp(app)

  given Client[IO] = client

  val userData = User.CreationData(
    name = "John Doe",
    email = "john.doe@example.com",
    password = "Abc123?!"
  )

  val authTokensFixture = ResourceSuiteLocalFixture(
    "authTokens",
    Resource.make(
      for
        user <- {
          given Option[User] = None
          Users.register(userData)
        }
        login <- user match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            Users.login(User.LoginData(user.email, userData.password))
        authTokens = login match
          case Left(error)       => fail(error.toString)
          case Right(authTokens) => authTokens
      yield (authTokens)
    )(_ => Users.collection.use(_.drop))
  )

  override val munitFixtures = List(authTokensFixture)

  test("should always respond to public routes") {
    client.expect[String](GET(uri"/")).assertEquals("Public")
  }

  test("should work with authorized user") {
    val authTokens = authTokensFixture()
    val request = GET(uri"/me").sign(authTokens)

    client.expect[String](request).assertEquals(s"Welcome, ${userData.name}")
  }

  test("should return 403 if auth header is missing") {
    app.assertError(GET(uri"/me"), Forbidden, __.ErrorInvalidAccessToken)
  }

  test("should return 403 if the token is invalid") {
    val request =
      GET(uri"/me").sign(JWT.AuthTokens("invalid-token", "invalid-token"))

    app.assertError(request, Forbidden, __.ErrorInvalidAccessToken)
  }
}
