package it.mconst.cooler.routes

import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import cats.syntax.traverse.*
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.project.Project
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.task.DbTask
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.task.TaskWithStats
import it.mconst.cooler.models.task.TaskWithProjectLabel
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import java.time.format.DateTimeFormatter
import java.time.LocalDateTime
import mongo4cats.bson.ObjectId
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

class TaskRoutesTest extends CatsEffectSuite {
  val app = TaskRoutes().orNotFound
  val client: HttpClient[IO] = HttpClient.fromHttpApp(app)

  given Lang = Lang.Default
  given Assertions = this
  given HttpClient[IO] = client

  given EntityDecoder[IO, Cursor[TaskWithProjectLabel]] =
    jsonOf[IO, Cursor[TaskWithProjectLabel]]

  given EntityDecoder[IO, DbTask] = jsonOf[IO, DbTask]
  given EntityDecoder[IO, TaskWithStats] = jsonOf[IO, TaskWithStats]

  final case class TestData(user: User, client: Client, project: Project)

  val testDataFixture = ResourceSuiteLocalFixture(
    "testData",
    Resource.make {
      for
        user <- {
          given Option[User] = none[User]
          Users
            .create(
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
      startTime = BsonDateTime(System.currentTimeMillis).toISOString,
      expectedWorkingHours = 10f,
      hourlyCost = 25f
    )

    POST(data, uri"/")
      .sign(testDataFixture().user)
      .shouldRespondLike(
        (t: DbTask) => t.name,
        data.name
      )
  }

  def tasksList = Resource.make {
    val tasks = List(
      makeTestTask(testDataFixture().project._id),
      makeTestTask(testDataFixture().project._id),
      makeTestTask(testDataFixture().project._id),
      makeTestTask(testDataFixture().project._id),
      makeTestTask(testDataFixture().project._id),
      makeTestTask(testDataFixture().project._id)
    )

    given User = testDataFixture().user

    Tasks.collection
      .use(_.raw(_.deleteMany(Filter.empty)))
      .flatMap(_ =>
        tasks.traverse(data =>
          IO.delay(Thread.sleep(1)).flatMap(_ => Tasks.create(data).orFail)
        )
      )
  }(_ => Tasks.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find tasks (asc)") {
    tasksList.use { tasks =>
      GET(
        Uri
          .fromString(s"/?first=2&after=${tasks(1).updatedAt.toISOString}")
          .getOrElse(fail(""))
      )
        .sign(testDataFixture().user)
        .shouldRespondLike(
          (result: Cursor[TaskWithProjectLabel]) =>
            Cursor[ObjectId](
              result.pageInfo,
              result.edges.map(e => Edge(e.node._id, e.cursor))
            ),
          Cursor[ObjectId](
            PageInfo(
              6,
              Some(tasks(2).updatedAt.toISOString),
              Some(tasks(3).updatedAt.toISOString),
              true,
              true
            ),
            List(
              Edge(tasks(2)._id, tasks(2).updatedAt.toISOString),
              Edge(tasks(3)._id, tasks(3).updatedAt.toISOString)
            )
          )
        )
    }
  }

  test("should find tasks (desc)") {
    tasksList.use { tasks =>
      GET(
        Uri
          .fromString(s"/?last=2&before=${tasks(4).updatedAt.toISOString}")
          .getOrElse(fail(""))
      )
        .sign(testDataFixture().user)
        .shouldRespondLike(
          (result: Cursor[TaskWithProjectLabel]) =>
            Cursor[ObjectId](
              result.pageInfo,
              result.edges.map(e => Edge(e.node._id, e.cursor))
            ),
          Cursor[ObjectId](
            PageInfo(
              6,
              Some(tasks(3).updatedAt.toISOString),
              Some(tasks(2).updatedAt.toISOString),
              true,
              true
            ),
            List(
              Edge(tasks(3)._id, tasks(3).updatedAt.toISOString),
              Edge(tasks(2)._id, tasks(2).updatedAt.toISOString)
            )
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
          (t: TaskWithStats) => t.name,
          data.name
        )
    yield ()
  }

  test("should update a task") {
    val user = testDataFixture().user

    val taskData =
      makeTestTask(
        testDataFixture().project._id,
        name = "Update route test",
        description = Some("Description")
      )

    val updateData = makeTestTask(
      testDataFixture().project._id,
      name = "Updated task name"
    )

    given User = user

    for
      task <- Tasks.create(taskData).orFail
      result <- client
        .expect[TaskWithStats](
          PUT(
            updateData,
            Uri.fromString(s"/${task._id.toString}").getOrElse(fail(""))
          ).sign(user)
        )
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
          (t: TaskWithStats) => t.name,
          taskData.name
        )
      _ <- Tasks
        .findById(task._id)
        .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
    yield ()
  }
}
