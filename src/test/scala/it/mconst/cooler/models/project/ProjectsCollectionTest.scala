package it.mconst.cooler.models.project

import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.Status

class ProjectsCollectionTest extends CatsEffectSuite {
  final case class TestData(user: User, client: Client)

  val testDataFixture = ResourceSuiteLocalFixture(
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
  given Assertions = this

  test("should create a project") {
    val data =
      makeTestProject(
        testDataFixture().client._id,
        name = "Project creation test",
        cashData =
          Some(ProjectCashData(BsonDateTime(System.currentTimeMillis), 1000.0))
      )

    Projects.create(data).orFail.map(_.name).assertEquals(data.name)
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

    val projects: List[Project.InputData] = List(
      makeTestProject(client._id, name = "Alice"),
      makeTestProject(client._id, name = "Bob"),
      makeTestProject(client._id, name = "Charlie"),
      makeTestProject(client._id, name = "Daniel"),
      makeTestProject(client._id, name = "Eleanor"),
      makeTestProject(client._id, name = "Frederick")
    )

    import cats.syntax.parallel.*

    Projects.collection.use(_.raw(_.deleteMany(Filter.empty)).flatMap { _ =>
      projects
        .map(Projects.create(_).orFail)
        .parSequence
        .map(
          _.sortWith(_.name.toString < _.name.toString)
        )
    })
  }(_ => Projects.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find a project") {
    projectsList.use { projects =>
      for
        result <- Projects
          .find(
            CursorQueryAsc(
              query = Some("a"),
              first = Some(PositiveInteger.unsafe(2)),
              after = Some("Alice")
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 4)
        _ = assertEquals(result.pageInfo.startCursor, Some("Charlie"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Daniel"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, true)
        _ = assertEquals(result.pageInfo.hasNextPage, true)
        _ = assertEquals(result.edges.length, 2)
        _ = assertEquals(
          result.edges.map(_.node),
          List(projects(2), projects(3))
        )
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
            .find(CursorQueryAsc(query = Some("a")))
            .orFail
            .map(_.edges.map(_.node.name.toString))
          _ = assertEquals(result, List("Adam"))
        yield ()
      }
    }
  }

  test("should update a project") {
    val client = testDataFixture().client
    val data = makeTestProject(client._id, name = "Update full test")

    val newClientData =
      makeTestBusinessClient(addressEmail = "new-project-client@example.com")

    for
      client <- Clients.create(newClientData).orFail.map(_.asBusiness)
      project <- Projects.create(data).orFail
      update = Project.InputData(
        client._id.toString,
        "Updated name",
        Some("Updated description"),
        Some(ProjectCashData(BsonDateTime(System.currentTimeMillis), 42.0))
      )
      _ <- IO.delay(Thread.sleep(500))
      updated <- Projects.update(project._id, update).orFail
      _ = assertEquals(updated.client.toString, update.client)
      _ = assertEquals(updated.name.toString, update.name)
      _ = assertEquals(updated.description.map(_.toString), update.description)
      _ = assertEquals(updated.cashData, update.cashData)
    yield ()
  }

  test("should unset empty optional fields") {
    val client = testDataFixture().client
    val data = makeTestProject(client._id, name = "Update unset if empty test")

    for
      project <- Projects.create(data).orFail
      update = Project.InputData(
        client._id.toHexString,
        "Updated name",
        none[String],
        none[ProjectCashData]
      )
      updated <- Projects.update(project._id, update).orFail
      _ = assertEquals(updated.description.map(_.toString), none[String])
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
      _ <- Projects.delete(project._id).orFail.assertEquals(project)
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
}
