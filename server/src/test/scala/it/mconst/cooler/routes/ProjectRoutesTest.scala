package it.mconst.cooler.routes

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.client.ClientType
import it.mconst.cooler.models.project.ClientLabel
import it.mconst.cooler.models.project.ProjectCashData
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.project.ProjectWithClientLabel
import it.mconst.cooler.models.project.ProjectWithStats
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.client.{Client as HttpClient}
import org.http4s.client.dsl.io.*
import org.http4s.dsl.io.*
import org.http4s.EntityDecoder
import org.http4s.implicits.*
import org.http4s.Status
import org.http4s.Uri

class ProjectRoutesTest extends IOSuite {
  val app = ProjectRoutes().orNotFound
  val client: HttpClient[IO] = HttpClient.fromHttpApp(app)

  given Lang = Lang.Default
  given HttpClient[IO] = client

  given EntityDecoder[IO, ProjectWithClientLabel] =
    jsonOf[IO, ProjectWithClientLabel]

  given EntityDecoder[IO, ProjectWithStats] = jsonOf[IO, ProjectWithStats]

  final case class TestData(user: User, client: Client)

  val testDataFixture = IOFixture(
    "testData",
    Resource.make {
      for
        user <- {
          given Option[User] = none[User]
          Users
            .create(
              User.CreationData(
                "Project routes test admin",
                "project-routes-test-admin@example.com",
                "S0m3P4ssw0rd!"
              )
            )
            .orFail
        }
        client <- {
          given User = user
          Clients
            .create(
              makeTestPrivateClient(addressEmail =
                "project-routes-test-client@example.com"
              )
            )
            .orFail
        }
      yield TestData(user, client)
    }(_ =>
      Users.collection
        .use(_.drop)
        .both(Clients.collection.use(_.drop))
        .both(Projects.collection.use(_.drop))
        .void
    )
  )

  override val munitFixtures = List(testDataFixture)

  test("should create a project") {
    val data = makeTestProject(
      testDataFixture().client._id,
      name = "Create test",
      description = Some("Some description"),
      cashData =
        Some(ProjectCashData(BsonDateTime(System.currentTimeMillis), 1000.00))
    )

    POST(data, uri"/")
      .sign(testDataFixture().user)
      .shouldRespondLike(
        (p: ProjectWithClientLabel) => p.name,
        data.name
      )
  }

  def projectsList = Resource.make {
    val projects = List(
      makeTestProject(testDataFixture().client._id, name = "Project A"),
      makeTestProject(testDataFixture().client._id, name = "Project B"),
      makeTestProject(testDataFixture().client._id, name = "Project C"),
      makeTestProject(testDataFixture().client._id, name = "Project D"),
      makeTestProject(testDataFixture().client._id, name = "Project E"),
      makeTestProject(testDataFixture().client._id, name = "Project F")
    )

    import cats.syntax.parallel.*
    given User = testDataFixture().user

    Projects.collection
      .use(_.raw(_.deleteMany(Filter.empty)))
      .flatMap(_ => projects.map(Projects.create(_).orFail).parSequence)
  }(_ => Projects.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find projects (asc)") {
    projectsList.use { projects =>
      val client = testDataFixture().client.asPrivate
      val projectsWithClientLabel: List[ProjectWithClientLabel] =
        projects.map(p =>
          ProjectWithClientLabel(
            p._id,
            p.name,
            p.description,
            p.expectedBudget,
            p.cashData,
            p.createdAt,
            p.updatedAt,
            ClientLabel(
              client._id,
              ClientType.fromPrivate(client.`type`),
              client.name
            )
          )
        )

      GET(uri"/?query=project&first=2&after=Project%20B")
        .sign(testDataFixture().user)
        .shouldRespond(
          Cursor[ProjectWithClientLabel](
            PageInfo(6, Some("Project C"), Some("Project D"), true, true),
            List(
              Edge(projectsWithClientLabel(2), "Project C"),
              Edge(projectsWithClientLabel(3), "Project D")
            )
          )
        )
    }
  }

  test("should find projects (desc)") {
    projectsList.use { projects =>
      val client = testDataFixture().client.asPrivate
      val projectsWithClientLabel: List[ProjectWithClientLabel] =
        projects.map(p =>
          ProjectWithClientLabel(
            p._id,
            p.name,
            p.description,
            p.expectedBudget,
            p.cashData,
            p.createdAt,
            p.updatedAt,
            ClientLabel(
              client._id,
              ClientType.fromPrivate(client.`type`),
              client.name
            )
          )
        )

      GET(uri"/?query=project&last=2&before=Project%20E")
        .sign(testDataFixture().user)
        .shouldRespond(
          Cursor[ProjectWithClientLabel](
            PageInfo(6, Some("Project D"), Some("Project C"), true, true),
            List(
              Edge(projectsWithClientLabel(3), "Project D"),
              Edge(projectsWithClientLabel(2), "Project C")
            )
          )
        )
    }
  }

  test("should find a project by id") {
    val user = testDataFixture().user
    val data =
      makeTestProject(
        testDataFixture().client._id,
        name = "Find by id route test"
      )

    given User = user

    for
      project <- Projects.create(data).orFail
      _ <- GET(Uri.fromString(s"/${project._id.toString}").getOrElse(fail("")))
        .sign(user)
        .shouldRespondLike(
          (p: ProjectWithStats) => p.name,
          data.name
        )
    yield ()
  }

  test("should update a project") {
    val user = testDataFixture().user

    val projectData =
      makeTestProject(
        testDataFixture().client._id,
        name = "Update route test",
        description = Some("Description")
      )

    val updateData = makeTestProject(
      testDataFixture().client._id,
      name = "Updated project name"
    )

    given User = user

    for
      project <- Projects.create(projectData).orFail
      result <- client
        .expect[ProjectWithStats](
          PUT(
            updateData,
            Uri.fromString(s"/${project._id.toString}").getOrElse(fail(""))
          ).sign(user)
        )
      _ = assertEquals(result.name.toString, updateData.name)
      _ = assertEquals(result.description.map(_.toString), none[String])
    yield ()
  }

  test("should delete a project") {
    val projectData =
      makeTestProject(testDataFixture().client._id, name = "Delete route test")

    given User = testDataFixture().user

    for
      project <- Projects.create(projectData).orFail
      _ <- DELETE(
        Uri.fromString(s"/${project._id.toString}").getOrElse(fail(""))
      )
        .sign(testDataFixture().user)
        .shouldRespondLike(
          (p: ProjectWithStats) => p.name,
          projectData.name
        )
      _ <- Projects
        .findById(project._id)
        .assertEquals(Left(Error(Status.NotFound, __.ErrorProjectNotFound)))
    yield ()
  }
}
