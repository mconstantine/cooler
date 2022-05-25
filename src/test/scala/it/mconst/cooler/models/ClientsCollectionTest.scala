package it.mconst.cooler.models

import it.mconst.cooler.utils.TestUtils._
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.kernel.Resource
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import org.http4s.dsl.io._

class ClientsCollectionTest extends CatsEffectSuite {
  val adminFixture = ResourceSuiteLocalFixture(
    "admin",
    Resource.make({
      given Option[User] = None

      Users
        .register(
          User.CreationData(
            "Client collection test admin",
            "client-test-admin@example.com",
            "S0m3P4ssw0rd!?"
          )
        )
        .orFail
    })(_ =>
      Users.collection
        .use(_.drop)
        .both(Clients.collection.use(_.drop))
        .void
    )
  )

  override val munitFixtures = List(adminFixture)

  given User = adminFixture()
  given Lang = Lang.Default
  given Assertions = this

  test("should create a client") {
    val data = makeTestPrivateClient(addressEmail = "creation-test@example.com")

    Clients
      .create(data)
      .orFail
      .map(_.asPrivate.addressEmail)
      .assertEquals(data.addressEmail)
  }

  test("should find a client by id") {
    val data =
      makeTestBusinessClient(addressEmail = "find-by-id-test@example.com")

    for
      client <- Clients.create(data).orFail
      _ <- Clients
        .findById(client._id)
        .map(_.map(_.asBusiness.addressEmail))
        .assertEquals(Right(data.addressEmail))
    yield ()
  }

  test("should not find a client of another user by id") {
    val data =
      makeTestBusinessClient(addressEmail = "find-by-id-test@example.com")

    for
      user <- {
        given Option[User] = Some(adminFixture())

        Users
          .register(
            User.CreationData(
              "Client exclusivity test",
              "client-exclusivity-test@example.com",
              "Abc123?!"
            )
          )
          .orFail
      }
      client <- {
        given User = user
        Clients.create(data).orFail
      }
      _ <- Clients
        .findById(client._id)
        .assertEquals(Left(Error(NotFound, __.ErrorClientNotFound)))
    yield ()
  }
}
