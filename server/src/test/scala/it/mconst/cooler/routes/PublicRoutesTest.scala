package it.mconst.cooler.routes

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.Error
import mongo4cats.collection.operations.Filter
import org.http4s.client.Client
import org.http4s.client.dsl.io.*
import org.http4s.dsl.io.*
import org.http4s.implicits.*
import org.http4s.Request

class PublicRoutesTest extends IOSuite {
  val routes = PublicRoutes()
  val app = routes.orNotFound
  val client: Client[IO] = Client.fromHttpApp(app)

  given Lang = Lang.Default
  given Assertions = this
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

      val request = POST(data, uri"/register")

      for
        tokens <- client.expect[JWT.AuthTokens](request)
        _ <- JWT
          .decodeToken(tokens.accessToken, JWT.UserAccess)
          .orFail
          .map(_.name.toString)
          .assertEquals(data.name)
      yield ()
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
        tokens <- client.expect[JWT.AuthTokens](POST(data, uri"/register"))
        user <- JWT.decodeToken(tokens.accessToken, JWT.UserAccess).orFail
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
