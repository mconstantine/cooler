package it.mconst.cooler.routes

import it.mconst.cooler.utils.TestUtils.*
import munit.CatsEffectSuite

import cats.effect.IO
import cats.effect.kernel.Resource
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.{JWT, User, Users}
import it.mconst.cooler.models.user.given
import mongo4cats.collection.operations.Filter
import org.http4s.client.Client
import org.http4s.client.dsl.io.*
import org.http4s.dsl.io.*
import org.http4s.implicits.*
import org.http4s.Request

class PublicRoutesTest extends CatsEffectSuite {
  val routes = PublicRoutes()
  val app = routes.orNotFound
  val client: Client[IO] = Client.fromHttpApp(app)

  given Lang = Lang.Default
  given Client[IO] = client

  val cleanUsersCollection =
    Resource.make(IO.unit)(_ =>
      Users.collection.use(_.raw(_.deleteMany(Filter.empty).void))
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
          .value
          .assertEquals(Right(user))
      yield ()
    }
  }
}
