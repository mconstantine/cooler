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
import cats.effect.IO
import mongo4cats.collection.operations.Filter
import it.mconst.cooler.models.Client.PrivateCreationData
import it.mconst.cooler.models.Client.BusinessCreationData

class ClientsCollectionTest extends CatsEffectSuite {
  val adminFixture = ResourceSuiteLocalFixture(
    "admin",
    Resource.make {
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
    }(_ =>
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

  test("should update a client (empty update)") {
    val data =
      makeTestBusinessClient(addressEmail = "update-empty-test@example.com")

    val update = Client.BusinessUpdateData()

    for
      client <- Clients.create(data).orFail.map(_.asBusiness)
      _ <- IO.delay(Thread.sleep(500))
      updated <- Clients.update(client._id, update).orFail.map(_.asBusiness)
      _ = assertEquals(updated.countryCode.toString, data.countryCode)
      _ = assertEquals(updated.businessName.toString, data.businessName)
      _ = assertEquals(updated.vatNumber.toString, data.vatNumber)
      _ = assertEquals(updated.addressCountry.toString, data.addressCountry)
      _ = assertEquals(updated.addressProvince.toString, data.addressProvince)
      _ = assertEquals(updated.addressZIP.toString, data.addressZIP)
      _ = assertEquals(updated.addressCity.toString, data.addressCity)
      _ = assertEquals(updated.addressStreet.toString, data.addressStreet)
      _ = assertEquals(
        updated.addressStreetNumber.map(_.toString),
        data.addressStreetNumber
      )
      _ = assertEquals(updated.addressEmail.toString, data.addressEmail)
      _ = assertNotEquals(updated.updatedAt.getValue, client.updatedAt.getValue)
    yield ()
  }

  test("should update a client (full update)") {
    val data =
      makeTestPrivateClient(addressEmail = "update-full-test@example.com")

    val update = Client.PrivateUpdateData(
      Some("Updated fiscalCode"),
      Some("Updated firstName"),
      Some("Updated lastName"),
      Some("IT"),
      Some("MI"),
      Some("98765"),
      Some("Updated addressCity"),
      Some("Updated addressStreet"),
      Some("Updated addressStreetNumber"),
      Some("updated-address-email@example.com")
    )

    for
      client <- Clients.create(data).orFail.map(_.asPrivate)
      _ <- IO.delay(Thread.sleep(500))
      updated <- Clients.update(client._id, update).orFail.map(_.asPrivate)
      _ = assertEquals(updated.fiscalCode.toString, update.fiscalCode.get)
      _ = assertEquals(updated.firstName.toString, update.firstName.get)
      _ = assertEquals(updated.lastName.toString, update.lastName.get)
      _ = assertEquals(
        updated.addressCountry.toString,
        update.addressCountry.get
      )
      _ = assertEquals(
        updated.addressProvince.toString,
        update.addressProvince.get
      )
      _ = assertEquals(updated.addressZIP.toString, update.addressZIP.get)
      _ = assertEquals(updated.addressCity.toString, update.addressCity.get)
      _ = assertEquals(updated.addressStreet.toString, update.addressStreet.get)
      _ = assertEquals(
        updated.addressStreetNumber.map(_.toString),
        update.addressStreetNumber
      )
      _ = assertEquals(updated.addressEmail.toString, update.addressEmail.get)
      _ = assertNotEquals(updated.updatedAt.getValue, client.updatedAt.getValue)
    yield ()
  }

  test("should not update a client of another user") {
    val data =
      makeTestPrivateClient(addressEmail = "update-full-test@example.com")

    val update = Client.PrivateUpdateData(addressEmail =
      Some("updated-address-email@example.com")
    )

    for
      user <- {
        given Option[User] = Some(adminFixture())

        Users
          .register(
            User.CreationData(
              "Update exclusivity test",
              "update-exclusivity-test@example.com",
              "Abc123?!"
            )
          )
          .orFail
      }
      client <- {
        given User = user
        Clients.create(data).orFail.map(_.asPrivate)
      }
      _ <- Clients
        .update(client._id, update)
        .assertEquals(Left(Error(NotFound, __.ErrorClientNotFound)))
    yield ()
  }

  test("should delete a client") {
    val data = makeTestBusinessClient(addressEmail = "delete-test@example.com")

    for
      client <- Clients.create(data).orFail
      _ <- Clients.delete(client._id).orFail.assertEquals(client)
      _ <- Clients
        .findById(client._id)
        .assertEquals(Left(Error(NotFound, __.ErrorClientNotFound)))
    yield ()
  }

  test("should not delete a client of another user") {
    val data = makeTestPrivateClient(addressEmail =
      "delete-exclusivity-test@example.com"
    )

    for
      user <- {
        given Option[User] = Some(adminFixture())

        Users
          .register(
            User.CreationData(
              "Delete exclusivity test",
              "delete-exclusivity-test@example.com",
              "Abc123?!"
            )
          )
          .orFail
      }
      client <- {
        given User = user
        Clients.create(data).orFail.map(_.asPrivate)
      }
      _ <- Clients
        .delete(client._id)
        .assertEquals(Left(Error(NotFound, __.ErrorClientNotFound)))
    yield ()
  }

  def clientsList = Resource.make {
    val clients: List[Client.CreationData] = List(
      makeTestBusinessClient(businessName = "Alex"),
      makeTestBusinessClient(businessName = "Alice"),
      makeTestBusinessClient(businessName = "Ally"),
      makeTestBusinessClient(businessName = "Bob"),
      makeTestPrivateClient(firstName = "Mark", lastName = "Alexson"),
      makeTestPrivateClient(firstName = "Mark", lastName = "Alison"),
      makeTestPrivateClient(firstName = "Mark", lastName = "Allyson"),
      makeTestPrivateClient(firstName = "Mark", lastName = "Bobson")
    )

    import cats.syntax.parallel._

    Clients.collection.use(_.deleteMany(Filter.empty)).flatMap { _ =>
      clients
        .map(Clients.create(_).orFail)
        .parSequence
        .map(_.sortWith(_.name < _.name))
    }

  }(_ => Clients.collection.use(_.deleteMany(Filter.empty)).void)

  test("should find a client") {
    clientsList.use { clients =>
      for
        result <- Clients
          .find(
            CursorQueryAsc(
              query = Some("al"),
              first = Some(2),
              after = Some("Alice")
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 6)
        _ = assertEquals(result.pageInfo.startCursor, Some("Ally"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Mark Alexson"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, true)
        _ = assertEquals(result.pageInfo.hasNextPage, true)
        _ = assertEquals(result.edges.length, 2)
        _ = assertEquals(result.edges.map(_.node), List(clients(2), clients(4)))
      yield ()
    }
  }

  test("should not include clients of other users when searching") {
    clientsList.use { _ =>
      for
        user <- {
          given Option[User] = Some(adminFixture())
          Users
            .register(
              User.CreationData(
                "Find exclusivity test",
                "find-exclusivity-test@example.com",
                "Abc123?!"
              )
            )
            .orFail
        }
        client <- {
          given User = user
          Clients
            .create(
              makeTestBusinessClient(businessName = "Alice Alison Alinc")
            )
            .orFail
        }
        result <- {
          given User = adminFixture()
          Clients
            .find(CursorQueryAsc(query = Some("ali")))
            .orFail
            .map(_.edges.map(_.node.name))
        }
        _ = assert(!result.contains("Alice Alison Alinc"))
      yield ()
    }
  }
}
