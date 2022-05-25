package it.mconst.cooler.models

import it.mconst.cooler.utils.TestUtils._
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.kernel.Resource
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users

class ClientsCollectionTest extends CatsEffectSuite {
  given Lang = Lang.Default
  given Assertions = this

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

  test("should create a client") {
    val data = makeTestPrivateClient(addressEmail = "creation-test@example.com")
    given User = adminFixture()

    Clients
      .create(data)
      .orFail
      .map(_.asPrivate.addressEmail)
      .assertEquals(data.addressEmail)
  }
}
