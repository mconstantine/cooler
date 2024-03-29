package it.mconst.cooler.models.project

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import cats.syntax.traverse.*
import com.osinka.i18n.Lang
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.client.ClientType
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import java.time.LocalDate
import mongo4cats.collection.operations.Filter
import mongo4cats.collection.operations.Update
import org.bson.BsonDateTime
import org.http4s.Status

class ProjectsCollectionTest extends IOSuite {
  final case class TestData(user: User, client: Client)

  val testDataFixture = IOFixture(
    "testData",
    Resource.make {
      given Option[User] = none[User]

      for
        admin <- Users
          .create(
            User.CreationData(
              "Project collection test admin",
              "project-test-admin@example.com",
              "S0m3P4ssw0rd!?"
            )
          )
          .orFail
        client <- {
          given User = admin

          Clients
            .create(makeTestPrivateClient())
            .orFail
        }
      yield TestData(admin, client)
    }(_ =>
      Users.collection
        .use(_.drop)
        .both(Clients.collection.use(_.drop))
        .both(Projects.collection.use(_.drop))
        .void
    )
  )

  override val munitFixtures = List(testDataFixture)

  given User = testDataFixture().user
  given Lang = Lang.Default

  test("should create a project") {
    val data =
      makeTestProject(
        testDataFixture().client._id,
        name = "Project creation test",
        cashData =
          Some(ProjectCashData(BsonDateTime(System.currentTimeMillis), 1000.0))
      )

    Projects.create(data).orFail.map(_.name.toString).assertEquals(data.name)
  }

  def otherUser = Resource.make {
    given Option[User] = Some(testDataFixture().user)
    Users
      .create(
        User.CreationData("Other user", "other-user@example.com", "Wh4t3v3r!")
      )
      .orFail
  } { user =>
    given User = user
    Users.delete.orFail.void
  }

  test("should reject creation of projects of clients of other users") {
    val data =
      makeTestProject(
        testDataFixture().client._id,
        name = "Project creation exclusivity test"
      )

    otherUser.use { user =>
      given User = user
      Projects
        .create(data)
        .assertEquals(
          Left(Error(Status.NotFound, __.ErrorClientNotFound))
        )
    }
  }

  test("should find a project by id") {
    val data =
      makeTestProject(
        testDataFixture().client._id,
        name = "Project find by id test",
        cashData =
          Some(ProjectCashData(BsonDateTime(System.currentTimeMillis), 1000.0))
      )

    for
      project <- Projects.create(data).orFail
      result <- Projects.findById(project._id).orFail
      _ = assert(result.name == data.name)
      _ = assert(result.client._id == testDataFixture().client._id)
    yield ()
  }

  test("should not find a project of a client of another user by id") {
    val data =
      makeTestProject(
        testDataFixture().client._id,
        name = "Project find by id exclusivity test"
      )

    otherUser.use { user =>
      for
        project <- Projects.create(data).orFail
        _ <- {
          given User = user
          Projects
            .findById(project._id)
            .assertEquals(Left(Error(Status.NotFound, __.ErrorProjectNotFound)))
        }
      yield ()
    }
  }

  def projectsList = Resource.make {
    val client = testDataFixture().client
    val today = BsonDateTime(LocalDate.now.toEpochDay * 86400000)
    val yesterday = BsonDateTime(today.getValue - 86400000)
    val tomorrow = BsonDateTime(today.getValue + 86400000)

    val projects: List[Project.InputData] = List(
      makeTestProject(
        client._id,
        name = "Alice",
        invoiceData = Some(Project.InvoiceDataInput("00", today.toISOString))
      ),
      makeTestProject(
        client._id,
        name = "Bob"
      ),
      makeTestProject(
        client._id,
        name = "Charlie",
        cashData =
          Some(ProjectCashData(BsonDateTime(System.currentTimeMillis), 42f)),
        endTime = tomorrow.toISOString,
        invoiceData = Some(Project.InvoiceDataInput("02", today.toISOString))
      ),
      makeTestProject(
        client._id,
        name = "Daniel",
        endTime = yesterday.toISOString
      ),
      makeTestProject(
        client._id,
        name = "Eleanor",
        startTime = yesterday.toISOString,
        invoiceData = Some(Project.InvoiceDataInput("01", today.toISOString))
      ),
      makeTestProject(
        client._id,
        name = "Frederick",
        startTime = tomorrow.toISOString,
        invoiceData = Some(Project.InvoiceDataInput("42", today.toISOString))
      )
    )

    import cats.syntax.traverse.*

    Projects.collection.use(
      _.raw(_.deleteMany(Filter.empty)).flatMap(_ =>
        projects.traverse(Projects.create(_).orFail)
      )
    )
  }(_ => Projects.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find a project") {
    projectsList.use { projects =>
      val client = testDataFixture().client.asPrivate

      for
        result <- Projects
          .find(
            CursorQueryAsc(
              query = Some("a"),
              first = Some(PositiveInteger.unsafe(2)),
              after = Some("Alice")
            ),
            ProjectQueryFilters.empty
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 4)
        _ = assertEquals(result.pageInfo.startCursor, Some("Charlie"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Daniel"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, true)
        _ = assertEquals(result.pageInfo.hasNextPage, true)
        _ = assertEquals(result.edges.length, 2)
        _ = assertEquals(
          result.edges.map(_.node._id),
          List(projects(2)._id, projects(3)._id)
        )
      yield ()
    }
  }

  test("should handle filters (withInvoiceData)") {
    projectsList.use { projects =>
      for
        resultWithTrue <- Projects
          .find(
            CursorQuery.empty,
            ProjectQueryFilters(
              none[Boolean],
              Some(true),
              none[Boolean],
              none[Boolean]
            )
          )
          .orFail
          .map(_.edges.map(_.node._id))
        resultWithFalse <- Projects
          .find(
            CursorQuery.empty,
            ProjectQueryFilters(
              none[Boolean],
              Some(false),
              none[Boolean],
              none[Boolean]
            )
          )
          .orFail
          .map(_.edges.map(_.node._id))
        _ = assert(resultWithTrue.contains(projects(0)._id))
        _ = assert(!resultWithTrue.contains(projects(1)._id))
        _ = assert(resultWithFalse.contains(projects(1)._id))
        _ = assert(!resultWithFalse.contains(projects(0)._id))
      yield ()
    }
  }

  test("should handle filters (cashed)") {
    projectsList.use { projects =>
      for
        resultWithTrue <- Projects
          .find(
            CursorQuery.empty,
            ProjectQueryFilters(
              Some(true),
              none[Boolean],
              none[Boolean],
              none[Boolean]
            )
          )
          .orFail
          .map(_.edges.map(_.node._id))
        resultWithFalse <- Projects
          .find(
            CursorQuery.empty,
            ProjectQueryFilters(
              Some(false),
              none[Boolean],
              none[Boolean],
              none[Boolean]
            )
          )
          .orFail
          .map(_.edges.map(_.node._id))
        _ = assert(resultWithTrue.contains(projects(2)._id))
        _ = assert(!resultWithTrue.contains(projects(3)._id))
        _ = assert(resultWithFalse.contains(projects(3)._id))
        _ = assert(!resultWithFalse.contains(projects(2)._id))
      yield ()
    }
  }

  test("should handle filters (started)") {
    projectsList.use { projects =>
      for
        resultWithTrue <- Projects
          .find(
            CursorQuery.empty,
            ProjectQueryFilters(
              none[Boolean],
              none[Boolean],
              Some(true),
              none[Boolean]
            )
          )
          .orFail
          .map(_.edges.map(_.node._id))
        resultWithFalse <- Projects
          .find(
            CursorQuery.empty,
            ProjectQueryFilters(
              none[Boolean],
              none[Boolean],
              Some(false),
              none[Boolean]
            )
          )
          .orFail
          .map(_.edges.map(_.node._id))
        _ = assert(resultWithTrue.contains(projects(4)._id))
        _ = assert(!resultWithTrue.contains(projects(5)._id))
        _ = assert(resultWithFalse.contains(projects(5)._id))
        _ = assert(!resultWithFalse.contains(projects(4)._id))
      yield ()
    }
  }

  test("should handle filters (ended)") {
    projectsList.use { projects =>
      for
        resultWithTrue <- Projects
          .find(
            CursorQuery.empty,
            ProjectQueryFilters(
              none[Boolean],
              none[Boolean],
              none[Boolean],
              Some(true)
            )
          )
          .orFail
          .map(_.edges.map(_.node._id))
        resultWithFalse <- Projects
          .find(
            CursorQuery.empty,
            ProjectQueryFilters(
              none[Boolean],
              none[Boolean],
              none[Boolean],
              Some(false)
            )
          )
          .orFail
          .map(_.edges.map(_.node._id))
        _ = assert(resultWithTrue.contains(projects(3)._id))
        _ = assert(!resultWithTrue.contains(projects(2)._id))
        _ = assert(resultWithFalse.contains(projects(2)._id))
        _ = assert(!resultWithFalse.contains(projects(3)._id))
      yield ()
    }
  }

  test("should not include projects of clients of other users when searching") {
    projectsList.use { _ =>
      otherUser.use { user =>
        given User = user

        for
          client <- Clients.create(makeTestBusinessClient()).orFail
          project <- Projects
            .create(makeTestProject(client._id, name = "Adam"))
            .orFail
          result <- Projects
            .find(CursorQueryAsc(query = Some("a")), ProjectQueryFilters.empty)
            .orFail
            .map(_.edges.map(_.node.name.toString))
          _ = assertEquals(result, List("Adam"))
        yield ()
      }
    }
  }

  test("should find invoices") {
    projectsList.use(projects =>
      Projects
        .findInvoices(
          CursorQueryAsc(Some("0"), Some(PositiveInteger.unsafe(1)), Some("01"))
        )
        .orFail
        .map(_.edges.map(_.node.invoiceNumber.toString))
        .assertEquals(List("02"))
    )
  }

  test("should find the next project") {
    projectsList.use(projects =>
      Projects
        .getNext(projects(1)._id)
        .orFail
        .map(_._id)
        .assertEquals(projects(2)._id)
    )
  }

  test("should find the previous project") {
    projectsList.use(projects =>
      Projects
        .getPrevious(projects(1)._id)
        .orFail
        .map(_._id)
        .assertEquals(projects(0)._id)
    )
  }

  test("should update a project") {
    val client = testDataFixture().client
    val data = makeTestProject(client._id, name = "Update full test")

    val newClientData =
      makeTestBusinessClient(addressEmail = "new-project-client@example.com")

    for
      client <- Clients.create(newClientData).orFail.map(_.asBusiness)
      project <- Projects.create(data).orFail
      update = makeTestProject(
        client._id,
        "Updated name",
        Some("Updated description"),
        Some(42f),
        Some(
          Project.InvoiceDataInput(
            "0",
            BsonDateTime(System.currentTimeMillis).toISOString
          )
        ),
        Some(ProjectCashData(BsonDateTime(System.currentTimeMillis), 42.0))
      )
      _ <- IO.delay(Thread.sleep(500))
      updated <- Projects.update(project._id, update).orFail
      _ = assertEquals(updated.client._id.toString, update.client)
      _ = assertEquals(updated.name.toString, update.name)
      _ = assertEquals(updated.description.map(_.toString), update.description)
      _ = assertEquals(
        updated.expectedBudget.map(_.toNumber),
        update.expectedBudget
      )
      _ = assertEquals(updated.cashData, update.cashData)
    yield ()
  }

  test("should unset empty optional fields") {
    val client = testDataFixture().client

    val data = makeTestProject(
      client._id,
      name = "Update unset if empty test",
      description = Some("Some description"),
      expectedBudget = Some(42f),
      invoiceData = Some(
        Project.InvoiceDataInput(
          "0",
          BsonDateTime(System.currentTimeMillis).toISOString
        )
      ),
      cashData =
        Some(ProjectCashData(BsonDateTime(System.currentTimeMillis), 42f)),
    )

    for
      project <- Projects.create(data).orFail
      update = makeTestProject(
        client._id,
        "Updated name",
        none[String],
        none[BigDecimal],
        none[Project.InvoiceDataInput],
        none[ProjectCashData]
      )
      updated <- Projects.update(project._id, update).orFail
      _ = assertEquals(updated.description.map(_.toString), none[String])
      _ = assertEquals(updated.expectedBudget.map(_.toNumber), none[BigDecimal])
      _ = assertEquals(updated.cashData, none[ProjectCashData])
    yield ()
  }

  test("should not update a project of another user") {
    otherUser.use { otherUser =>
      val data = makeTestProject(
        testDataFixture().client._id,
        name = "Update exclusivity test"
      )

      for
        project <- Projects.create(data).orFail
        _ <- {
          given User = otherUser

          Projects
            .update(project._id, makeTestProject(testDataFixture().client._id))
            .assertEquals(Left(Error(Status.NotFound, __.ErrorProjectNotFound)))
        }
      yield ()
    }
  }

  test("should not accept an updated client if it is of another user") {
    otherUser.use { otherUser =>
      val testData = testDataFixture()
      val originalUser = testData.user
      val originalClient = testData.client
      val updatedClientData = makeTestPrivateClient()

      val projectData = makeTestProject(
        originalClient._id,
        name = "Update client exclusivity test"
      )

      for
        project <- Projects.create(projectData).orFail
        updatedClient <- {
          given User = otherUser
          Clients.create(updatedClientData).orFail
        }
        projectUpdateData = makeTestProject(updatedClient._id)
        _ <- Projects
          .update(project._id, projectUpdateData)
          .assertEquals(Left(Error(Status.NotFound, __.ErrorClientNotFound)))
      yield ()
    }
  }

  test("should delete a project") {
    val data =
      makeTestProject(testDataFixture().client._id, name = "Delete test")

    for
      project <- Projects.create(data).orFail
      _ <- Projects
        .delete(project._id)
        .orFail
        .map(_._id)
        .assertEquals(project._id)
      _ <- Projects
        .findById(project._id)
        .assertEquals(Left(Error(Status.NotFound, __.ErrorProjectNotFound)))
    yield ()
  }

  test("should not delete a project of another user") {
    otherUser.use { otherUser =>
      val data = makeTestProject(
        testDataFixture().client._id,
        name = "Delete exclusivity test"
      )

      for
        project <- Projects.create(data).orFail
        _ <- {
          given User = otherUser

          Projects
            .delete(project._id)
            .assertEquals(Left(Error(Status.NotFound, __.ErrorProjectNotFound)))
        }
      yield ()
    }
  }

  test("should get the latest projects") {
    val client = testDataFixture().client.asPrivate
    val now = System.currentTimeMillis

    projectsList.use { projects =>
      for
        updated <- (0 until projects.size).toList
          .traverse { index =>
            val project = projects(index)

            Projects.collection.use(
              _.raw(collection =>
                collection
                  .updateOne(
                    Filter.eq("_id", project._id),
                    Update.set(
                      "updatedAt",
                      BsonDateTime(
                        now - (projects.size * index) * 3600000
                      ).toISOString
                    )
                  )
                  .flatMap(_ =>
                    collection
                      .find(Filter.eq("_id", project._id))
                      .first
                      .map(_.get)
                  )
              )
            )
          }
          .map(_.sortWith(_.updatedAt.getValue < _.updatedAt.getValue))
        result <- Projects
          .getLatest(CursorQuery.empty)
          .orFail
          .map(_.edges.map(_.node._id))
          .assertEquals(updated.map(_._id))
      yield ()
    }
  }
}
