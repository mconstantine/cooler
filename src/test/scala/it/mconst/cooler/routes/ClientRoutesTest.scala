package it.mconst.cooler.routes

import munit.CatsEffectSuite
import it.mconst.cooler.utils.TestUtils._

import cats.effect.IO
import cats.effect.kernel.Resource
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.models.asBusiness
import it.mconst.cooler.models.Client
import it.mconst.cooler.models.Clients
import it.mconst.cooler.models.given
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import munit.Assertions
import org.http4s.client.{Client as HttpClient}
import org.http4s.client.dsl.io._
import org.http4s.dsl.io._
import org.http4s.implicits._

class ClientRoutesTest extends CatsEffectSuite {
  val app = ClientRoutes().orNotFound
  val client: HttpClient[IO] = HttpClient.fromHttpApp(app)

  given Lang = Lang.Default
  given Assertions = this
  given HttpClient[IO] = client

  val adminFixture = ResourceSuiteLocalFixture(
    "admin",
    Resource.make(
      {
        given Option[User] = None

        Users
          .register(
            User.CreationData(
              "Client routes test admin",
              "client-routes-test-admin@example.com",
              "S0m3P4ssw0rd!?"
            )
          )
          .orFail
      }
    )(_ =>
      Users.collection.use(_.drop).both(Clients.collection.use(_.drop)).void
    )
  )

  override val munitFixtures = List(adminFixture)

  test("should register a client") {
    val data =
      makeTestBusinessClient(addressEmail = "register-test@example.com")

    POST(data, uri"/")
      .sign(adminFixture())
      .shouldRespondLike(
        (c: Client) => c.asBusiness.addressEmail,
        data.addressEmail
      )
  }
}
