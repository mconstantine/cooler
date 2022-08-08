package it.mconst.cooler.middlewares

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.data.EitherT
import cats.effect.IO
import cats.effect.kernel.Resource
import cats.effect.unsafe.implicits.global
import cats.syntax.all.*
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware.*
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Translations
import org.bson.BsonDateTime
import org.http4s.AuthedRoutes
import org.http4s.client.Client
import org.http4s.client.dsl.io.*
import org.http4s.dsl.io.*
import org.http4s.HttpApp
import org.http4s.HttpRoutes
import org.http4s.implicits.*

class UserMiddlewareTest extends IOSuite {
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

  val authTokensFixture = IOFixture(
    "authTokens",
    Resource.make(
      for
        user <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        authTokens <- Users
          .login(User.LoginData(user.email, userData.password))
          .orFail
      yield authTokens
    )(_ => Users.collection.use(c => c.drop))
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
      GET(uri"/me").sign(
        JWT.AuthTokens("invalid-token", "invalid-token", BsonDateTime(0L))
      )

    app.assertError(request, Forbidden, __.ErrorInvalidAccessToken)
  }
}
