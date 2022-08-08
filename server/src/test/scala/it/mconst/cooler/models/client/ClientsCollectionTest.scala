package it.mconst.cooler.models.client

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.data.EitherT
import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import it.mconst.cooler.models.*
import it.mconst.cooler.models.project.Project
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.project.ProjectWithClientLabel
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import mongo4cats.bson.ObjectId
import mongo4cats.collection.operations.Filter
import org.http4s.Status

class ClientsCollectionTest extends IOSuite {
  val adminFixture = IOFixture(
    "admin",
    Resource.make {
      given Option[User] = none[User]

      Users
        .create(
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

  test("should create a client") {
    val data = makeTestPrivateClient(addressEmail = "creation-test@example.com")

    Clients
      .create(data)
      .orFail
      .map(_.asPrivate.addressEmail.toString)
      .assertEquals(data.addressEmail)
  }

  test("should find a client by id") {
    val data =
      makeTestBusinessClient(addressEmail = "find-by-id-test@example.com")

    for
      client <- Clients.create(data).orFail
      _ <- Clients
        .findById(client._id)
        .map(_.asBusiness.addressEmail)
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
          .create(
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
        .assertEquals(Left(Error(Status.NotFound, __.ErrorClientNotFound)))
    yield ()
  }

  test("should update a client") {
    val data =
      makeTestPrivateClient(addressEmail = "update-full-test@example.com")

    val update = Client.PrivateInputData(
      "PRIVATE",
      "Updated fiscalCode",
      "Updated firstName",
      "Updated lastName",
      "IT",
      "MI",
      "98765",
      "Updated addressCity",
      "Updated addressStreet",
      none[String],
      "updated-address-email@example.com"
    )

    for
      client <- Clients.create(data).orFail.map(_.asPrivate)
      _ <- IO.delay(Thread.sleep(500))
      updated <- Clients.update(client._id, update).orFail.map(_.asPrivate)
      _ = assertEquals(updated.fiscalCode.toString, update.fiscalCode)
      _ = assertEquals(updated.firstName.toString, update.firstName)
      _ = assertEquals(updated.lastName.toString, update.lastName)
      _ = assertEquals(
        updated.addressCountry.toString,
        update.addressCountry
      )
      _ = assertEquals(
        updated.addressProvince.toString,
        update.addressProvince
      )
      _ = assertEquals(updated.addressZIP.toString, update.addressZIP)
      _ = assertEquals(updated.addressCity.toString, update.addressCity)
      _ = assertEquals(updated.addressStreet.toString, update.addressStreet)
      _ = assertEquals(
        updated.addressStreetNumber.map(_.toString),
        none[String]
      )
      _ = assertEquals(updated.addressEmail.toString, update.addressEmail)
    yield ()
  }

  test("should not update a client of another user") {
    val data =
      makeTestPrivateClient(addressEmail = "update-full-test@example.com")

    val update =
      makeTestPrivateClient(addressEmail = "updated-address-email@example.com")

    for
      user <- {
        given Option[User] = Some(adminFixture())

        Users
          .create(
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
        .assertEquals(Left(Error(Status.NotFound, __.ErrorClientNotFound)))
    yield ()
  }

  test("should delete a client") {
    val data = makeTestBusinessClient(addressEmail = "delete-test@example.com")

    for
      client <- Clients.create(data).orFail
      _ <- Clients.delete(client._id).orFail.assertEquals(client)
      _ <- Clients
        .findById(client._id)
        .assertEquals(Left(Error(Status.NotFound, __.ErrorClientNotFound)))
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
          .create(
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
        .assertEquals(Left(Error(Status.NotFound, __.ErrorClientNotFound)))
    yield ()
  }

  def clientsList = Resource.make {
    val clients: List[Client.InputData] = List(
      makeTestBusinessClient(businessName = "Alex"),
      makeTestBusinessClient(businessName = "Alice"),
      makeTestBusinessClient(businessName = "Ally"),
      makeTestBusinessClient(businessName = "Bob"),
      makeTestPrivateClient(firstName = "Mark", lastName = "Alexson"),
      makeTestPrivateClient(firstName = "Mark", lastName = "Alison"),
      makeTestPrivateClient(firstName = "Mark", lastName = "Allyson"),
      makeTestPrivateClient(firstName = "Mark", lastName = "Bobson")
    )

    import cats.syntax.parallel.*

    Clients.collection.use(_.raw(_.deleteMany(Filter.empty)).flatMap { _ =>
      clients
        .map(Clients.create(_).orFail)
        .parSequence
        .map(_.sortWith(_.name.toString < _.name.toString))
    })
  }(_ => Clients.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find a client") {
    clientsList.use { clients =>
      for
        result <- Clients
          .find(
            CursorQueryAsc(
              query = Some("al"),
              first = Some(PositiveInteger.unsafe(2)),
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
            .create(
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

  def otherUser = Resource.make {
    given Option[User] = Some(adminFixture())

    Users
      .create(
        User.CreationData(
          "Client test other user",
          "client-test-other-user@example.com",
          "S0m3P4ssw0rd!"
        )
      )
      .orFail
  } { user =>
    given User = user
    Users.delete.orFail.void
  }

  final case class ClientWithProject(
      user: User,
      client: Client,
      project: ProjectWithClientLabel
  )

  def clientsWithProjects =
    otherUser.flatMap[List[ClientWithProject]](otherUser =>
      Resource.make {
        import cats.syntax.traverse.*

        def makeClientWithProject(
            user: User,
            clientData: Client.InputData
        ): (
            ObjectId => Project.InputData
        ) => IO[ClientWithProject] = makeProjectData => {
          given User = user

          for
            client <- Clients.create(clientData).orFail
            projectData = makeProjectData(client._id)
            project <- Projects.create(projectData).orFail
          yield ClientWithProject(user, client, project)
        }

        List(
          makeClientWithProject(
            adminFixture(),
            makeTestPrivateClient(addressEmail = "client1@example.com")
          )(clientId => makeTestProject(clientId, name = "project1")),
          makeClientWithProject(
            adminFixture(),
            makeTestPrivateClient(addressEmail = "client2@example.com")
          )(clientId => makeTestProject(clientId, name = "project2")),
          makeClientWithProject(
            otherUser,
            makeTestPrivateClient(addressEmail = "client3@example.com")
          )(clientId => makeTestProject(clientId, name = "project3"))
        ).traverse(identity)
      }(clientsWithProjects =>
        Clients.collection
          .use(
            _.raw(
              _.deleteMany(
                Filter.in("_id", clientsWithProjects.map(_.client._id))
              )
            )
          )
          .both(
            Projects.collection.use(
              _.raw(
                _.deleteMany(
                  Filter.in("_id", clientsWithProjects.map(_.project._id))
                )
              )
            )
          )
          .void
      )
    )

  test("should get client projects") {
    clientsWithProjects.use { clientsWithProjects =>
      val target = clientsWithProjects(0)

      Clients
        .getProjects(target.client._id, CursorQuery.empty)
        .orFail
        .assertEquals(
          Cursor(
            PageInfo(
              1,
              Some("project1"),
              Some("project1"),
              false,
              false
            ),
            List(Edge(target.project, "project1"))
          )
        )
    }
  }
}
