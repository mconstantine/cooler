package it.mconst.cooler.routes

import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.Client
import it.mconst.cooler.models.Clients
import it.mconst.cooler.models.Cursor
import it.mconst.cooler.models.Edge
import it.mconst.cooler.models.given
import it.mconst.cooler.models.PageInfo
import it.mconst.cooler.models.Project
import it.mconst.cooler.models.Projects
import it.mconst.cooler.models.Task
import it.mconst.cooler.models.Tasks
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import java.time.format.DateTimeFormatter
import java.time.LocalDateTime
import mongo4cats.collection.operations.Filter
import org.http4s.circe.*
import org.http4s.client.{Client as HttpClient}
import org.http4s.client.dsl.io.*
import org.http4s.dsl.io.*
import org.http4s.EntityDecoder
import org.http4s.implicits.*
import org.http4s.Status
import org.http4s.Uri

class TaskRoutesTest extends CatsEffectSuite {
  val app = TaskRoutes().orNotFound
  val client: HttpClient[IO] = HttpClient.fromHttpApp(app)

  given Lang = Lang.Default
  given Assertions = this
  given HttpClient[IO] = client

  final case class TestData(user: User, client: Client, project: Project)

  val testDataFixture = ResourceSuiteLocalFixture(
    "testData",
    Resource.make {
      for
        user <- {
          given Option[User] = none[User]
          Users
            .register(
              User.CreationData(
                "Task routes test admin",
                "task-routes-test-admin@example.com",
                "S0m3P4ssw0rd!"
              )
            )
            .orFail
        }
        client <- {
          given User = user
          Clients
            .create(
              makeTestBusinessClient(addressEmail =
                "task-routes-test-client@example.com"
              )
            )
            .orFail
        }
        project <- {
          given User = user
          Projects
            .create(
              makeTestProject(client._id, name = "Task routes test project")
            )
            .orFail
        }
      yield TestData(user, client, project)
    }(_ =>
      Users.collection
        .use(_.drop)
        .both(Clients.collection.use(_.drop))
        .both(Projects.collection.use(_.drop))
        .both(Tasks.collection.use(_.drop))
        .void
    )
  )

  override val munitFixtures = List(testDataFixture)

  test("should create a task") {
    val data = makeTestTask(
      testDataFixture().project._id,
      name = "Create test",
      description = Some("Some description"),
      startTime = LocalDateTime.now.format(DateTimeFormatter.ISO_DATE_TIME),
      expectedWorkingHours = 10f,
      hourlyCost = 25f
    )

    POST(data, uri"/")
      .sign(testDataFixture().user)
      .shouldRespondLike(
        (t: Task) => t.asDbTask.name,
        data.name
      )
  }

  def tasksList = Resource.make {
    val tasks = List(
      makeTestTask(testDataFixture().project._id, name = "Task A"),
      makeTestTask(testDataFixture().project._id, name = "Task B"),
      makeTestTask(testDataFixture().project._id, name = "Task C"),
      makeTestTask(testDataFixture().project._id, name = "Task D"),
      makeTestTask(testDataFixture().project._id, name = "Task E"),
      makeTestTask(testDataFixture().project._id, name = "Task F")
    )

    import cats.syntax.parallel.*
    given User = testDataFixture().user

    Tasks.collection
      .use(_.raw(_.deleteMany(Filter.empty)))
      .flatMap(_ => tasks.map(Tasks.create(_).orFail).parSequence)
  }(_ => Tasks.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find tasks (asc)") {
    tasksList.use { tasks =>
      given EntityDecoder[IO, Cursor[Task]] = jsonOf[IO, Cursor[Task]]

      GET(uri"/?query=task&first=2&after=Task%20B")
        .sign(testDataFixture().user)
        .shouldRespond(
          Cursor[Task](
            PageInfo(6, Some("Task C"), Some("Task D"), true, true),
            List(Edge(tasks(2), "Task C"), Edge(tasks(3), "Task D"))
          )
        )
    }
  }

  test("should find tasks (desc)") {
    tasksList.use { tasks =>
      given EntityDecoder[IO, Cursor[Task]] = jsonOf[IO, Cursor[Task]]

      GET(uri"/?query=task&last=2&before=Task%20E")
        .sign(testDataFixture().user)
        .shouldRespond(
          Cursor[Task](
            PageInfo(6, Some("Task D"), Some("Task C"), true, true),
            List(Edge(tasks(3), "Task D"), Edge(tasks(2), "Task C"))
          )
        )
    }
  }

  test("should find a task by id") {
    val user = testDataFixture().user
    val data =
      makeTestTask(
        testDataFixture().project._id,
        name = "Find by id route test"
      )

    given User = user

    for
      task <- Tasks.create(data).orFail
      _ <- GET(Uri.fromString(s"/${task._id.toString}").getOrElse(fail("")))
        .sign(user)
        .shouldRespondLike(
          (t: Task) => t.asTaskWithProject.name,
          data.name
        )
    yield ()
  }

  test("should update a project") {
    val user = testDataFixture().user

    val taskData =
      makeTestTask(
        testDataFixture().project._id,
        name = "Update route test",
        description = Some("Description")
      )

    val updateData = makeTestTask(
      testDataFixture().project._id,
      name = "Updated project name"
    )

    given User = user

    for
      task <- Tasks.create(taskData).orFail
      result <- client
        .expect[Task](
          PUT(
            updateData,
            Uri.fromString(s"/${task._id.toString}").getOrElse(fail(""))
          ).sign(user)
        )
        .map(_.asDbTask)
      _ = assertEquals(result.name.toString, updateData.name)
      _ = assertEquals(result.description.map(_.toString), none[String])
    yield ()
  }

  test("should delete a task") {
    val taskData =
      makeTestTask(testDataFixture().project._id, name = "Delete route test")

    given User = testDataFixture().user

    for
      task <- Tasks.create(taskData).orFail
      _ <- DELETE(
        Uri.fromString(s"/${task._id.toString}").getOrElse(fail(""))
      )
        .sign(testDataFixture().user)
        .shouldRespondLike(
          (t: Task) => t.asDbTask.name,
          taskData.name
        )
      _ <- Tasks
        .findById(task._id)
        .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
    yield ()
  }
}
