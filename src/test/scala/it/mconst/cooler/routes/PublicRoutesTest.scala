package it.mconst.cooler.routes

import munit.CatsEffectSuite
import it.mconst.cooler.utils.TestUtils._

import cats.effect.IO
import cats.effect.kernel.Resource
import it.mconst.cooler.models.user.{JWT, User, Users}
import it.mconst.cooler.models.user.given
import mongo4cats.collection.operations.Filter
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.io._
import org.http4s.implicits._
import org.http4s.Request
import com.osinka.i18n.Lang

class PublicRoutesTest extends CatsEffectSuite {
  val routes = PublicRoutes()
  val app = routes.orNotFound
  val client: Client[IO] = Client.fromHttpApp(app)

  given Lang = Lang.Default
  given Client[IO] = client

  val cleanUsersCollection =
    Resource.make(IO.unit)(_ =>
      Users.collection.use(c => c.deleteMany(Filter.empty).void)
    )

  test("should register a user") {
    cleanUsersCollection.use { _ =>
      val data = User.CreationData(
        "Registration test",
        "registration-test@example.com",
        "S0m3P4ssw0rd?!"
      )

      POST(data, uri"/register")
        .shouldRespondLike((user: User) => user.email, data.email)
    }
  }

  test("should login a user") {
    val data = User.CreationData(
      "Login test",
      "login-test@example.com",
      "S0m3P4ssw0rd?!"
    )

    cleanUsersCollection.use { _ =>
      for
        user <- client.expect[User](POST(data, uri"/register"))
        loginData = User.LoginData(user.email, data.password)
        authTokens <- client.expect[JWT.AuthTokens](
          POST(loginData, uri"/login")
        )
        _ <- JWT
          .decodeToken(authTokens.accessToken, JWT.UserAccess)
          .assertEquals(Right(user))
      yield ()
    }
  }
}
