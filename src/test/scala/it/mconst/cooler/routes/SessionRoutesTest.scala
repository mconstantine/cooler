package it.mconst.cooler.routes

import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.project.Project
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.session.given
import it.mconst.cooler.models.session.Session
import it.mconst.cooler.models.session.Sessions
import it.mconst.cooler.models.task.Task
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.given
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.client.{Client as HttpClient}
import org.http4s.client.dsl.io.*
import org.http4s.dsl.io.*
import org.http4s.EntityEncoder
import org.http4s.implicits.*
import org.http4s.syntax.*
import org.http4s.Uri

class SessionRoutesTest extends CatsEffectSuite {
  val app = SessionRoutes().orNotFound
  val client: HttpClient[IO] = HttpClient.fromHttpApp(app)

  given Lang = Lang.Default
  given Assertions = this
  given HttpClient[IO] = client

  final case class TestData(
      user: User,
      client: Client,
      project: Project,
      task: Task
  )

  val testDataFixture = ResourceSuiteLocalFixture(
    "testData",
    Resource.make(
      for
        user <- {
          given Option[User] = none[User]
          Users
            .create(
              User.CreationData(
                "Session routes test admin",
                "session-routes-test-admin@example.com",
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
                "session-routes-test-client@example.com"
              )
            )
            .orFail
        }
        project <- {
          given User = user
          Projects
            .create(
              makeTestProject(client._id, name = "Session routes test project")
            )
            .orFail
        }
        task <- {
          given User = user
          Tasks
            .create(
              makeTestTask(project._id, name = "Session routes test task")
            )
            .orFail
        }
      yield TestData(user, client, project, task)
    )(_ =>
      Users.collection
        .use(_.drop)
        .both(Clients.collection.use(_.drop))
        .both(Projects.collection.use(_.drop))
        .both(Tasks.collection.use(_.drop))
        .both(Sessions.collection.use(_.drop))
        .void
    )
  )

  override val munitFixtures = List(testDataFixture)

  test("should create a session") {
    val startTime = BsonDateTime(System.currentTimeMillis).toISOString
    val data = makeTestSession(testDataFixture().task._id, Some(startTime))

    POST(data, uri"/")
      .sign(testDataFixture().user)
      .shouldRespondLike((s: Session) => s.startTime.toISOString, startTime)
  }

  def sessionsList = Resource.make {
    val now = System.currentTimeMillis

    val sessions = List(
      makeTestSession(
        testDataFixture().task._id,
        Some(BsonDateTime(now - 6000).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        Some(BsonDateTime(now - 5000).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        Some(BsonDateTime(now - 4000).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        Some(BsonDateTime(now - 3000).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        Some(BsonDateTime(now - 2000).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        Some(BsonDateTime(now - 1000).toISOString)
      )
    )

    import cats.syntax.parallel.*
    given User = testDataFixture().user

    Sessions.collection
      .use(_.raw(_.deleteMany(Filter.empty)))
      .flatMap(_ => sessions.map(Sessions.start(_).orFail).parSequence)
  }(_ => Sessions.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find sessions (asc)") {
    sessionsList.use { sessions =>
      val taskId = testDataFixture().task._id.toHexString
      val after = sessions(1).startTime.toISOString

      given EntityEncoder[IO, Cursor[Session]] =
        jsonEncoderOf[IO, Cursor[Session]]

      GET(
        Uri
          .fromString(s"/$taskId?first=2&after=$after")
          .getOrElse(fail(""))
      )
        .sign(testDataFixture().user)
        .shouldRespond(
          Cursor[Session](
            PageInfo(
              6,
              Some(sessions(2).startTime.toISOString),
              Some(sessions(3).startTime.toISOString),
              true,
              true
            ),
            List(
              Edge(sessions(2), sessions(2).startTime.toISOString),
              Edge(sessions(3), sessions(3).startTime.toISOString)
            )
          )
        )
    }
  }

  test("should find sessions (desc)") {
    sessionsList.use { sessions =>
      val taskId = testDataFixture().task._id.toHexString
      val before = sessions(4).startTime.toISOString

      given EntityEncoder[IO, Cursor[Session]] =
        jsonEncoderOf[IO, Cursor[Session]]

      GET(
        Uri
          .fromString(s"/$taskId?last=2&before=$before")
          .getOrElse(fail(""))
      )
        .sign(testDataFixture().user)
        .shouldRespond(
          Cursor[Session](
            PageInfo(
              6,
              Some(sessions(3).startTime.toISOString),
              Some(sessions(2).startTime.toISOString),
              true,
              true
            ),
            List(
              Edge(sessions(3), sessions(3).startTime.toISOString),
              Edge(sessions(2), sessions(2).startTime.toISOString)
            )
          )
        )
    }
  }

  test("should update a session") {
    val user = testDataFixture().user
    val now = System.currentTimeMillis

    val originalData = makeTestSession(
      testDataFixture().task._id,
      Some(BsonDateTime(now - 3000).toISOString),
      Some(BsonDateTime(now - 2000).toISOString)
    )

    val updateData = makeTestSession(
      testDataFixture().task._id,
      Some(BsonDateTime(now - 2000).toISOString),
      Some(BsonDateTime(now - 1000).toISOString)
    )

    given User = user

    for
      session <- Sessions.start(originalData).orFail
      result <- client
        .expect[Session](
          PUT(
            updateData,
            Uri.fromString(s"/${session._id.toString}").getOrElse(fail(""))
          ).sign(user)
        )
      _ = assertEquals(result.startTime.toISOString, updateData.startTime.get)
      _ = assertEquals(result.endTime.map(_.toISOString), updateData.endTime)
    yield ()
  }

  test("should delete a session") {
    val taskId = testDataFixture().task._id
    val sessionData = makeTestSession(taskId)

    given User = testDataFixture().user

    for
      session <- Sessions.start(sessionData).orFail
      _ <- DELETE(
        Uri.fromString(s"/${session._id.toString}").getOrElse(fail(""))
      )
        .sign(testDataFixture().user)
        .shouldRespond(session)
      _ <- Sessions
        .getSessions(
          taskId,
          CursorQueryAsc(
            none[String],
            Some(PositiveInteger.unsafe(1000000)),
            none[String]
          )
        )
        .orFail
        .map(_.edges.map(_.node._id).contains(session._id))
        .assertEquals(false)
    yield ()
  }
}
