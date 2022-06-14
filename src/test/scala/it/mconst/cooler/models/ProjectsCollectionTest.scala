package it.mconst.cooler.models

import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import org.http4s.Status

class ProjectsCollectionTest extends CatsEffectSuite {
  final case class TestData(user: User, client: Client)

  val testDataFixture = ResourceSuiteLocalFixture(
    "testData",
    Resource.make {
      given Option[User] = none[User]

      for
        admin <- Users
          .register(
            User.CreationData(
              "Client collection test admin",
              "client-test-admin@example.com",
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
        name = "Project creation test"
      )

    Projects.create(data).orFail.map(_.asDbProject.name).assertEquals(data.name)
  }

  def otherUser = Resource.make {
    given Option[User] = Some(testDataFixture().user)
    Users
      .register(
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
        name = "Project find by id test"
      )

    for
      project <- Projects.create(data).orFail
      result <- Projects.findById(project._id).orFail
      _ = assert(result.asProjectWithClient.name == data.name)
      _ = assert(
        result.asProjectWithClient.client._id == testDataFixture().client._id
      )
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
}
