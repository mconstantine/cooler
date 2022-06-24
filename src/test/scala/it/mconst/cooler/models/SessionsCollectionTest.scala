package it.mconst.cooler.models

import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import org.bson.BsonDateTime
import it.mconst.cooler.utils.Error
import org.http4s.Status
import it.mconst.cooler.utils.__
import mongo4cats.collection.operations.Filter

class SessionsCollectionTest extends CatsEffectSuite {
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
            .register(
              User.CreationData(
                "Sessions collection test admin",
                "sessions-collection-test-admin@example.com",
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
                "sessions-collection-test-client@example.com"
              )
            )
            .orFail
        }
        project <- {
          given User = user
          Projects
            .create(
              makeTestProject(
                client._id,
                name = "Sessions collection test project"
              )
            )
            .orFail
        }
        task <- {
          given User = user
          Tasks
            .create(
              makeTestTask(project._id, name = "Sessions collection test task")
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

  override def munitFixtures = Seq(testDataFixture)

  given Lang = Lang.Default
  given Assertions = this
  given User = testDataFixture().user

  test("should start a session") {
    val testStartTime = System.currentTimeMillis
    val data = makeTestSession(testDataFixture().task._id)

    for
      session <- Sessions.start(data).orFail
      _ = assertEquals(session.task.toHexString, data.task)
      _ = assert(session.startTime.getValue >= testStartTime)
      _ = assertEquals(session.endTime, none[BsonDateTime])
    yield ()
  }

  def otherUser = Resource.make {
    given Option[User] = Some(testDataFixture().user)
    Users
      .register(
        User.CreationData("Other user", "other-user@example.com", "Wh4t3v3r!")
      )
      .orFail
  }(user => Users.collection.use(_.delete(user._id)).orFail.void)

  test("should not start a session of a task of another user") {
    otherUser.use { otherUser =>
      given User = otherUser
      Sessions
        .start(makeTestSession(testDataFixture().task._id))
        .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
    }
  }

  test("should stop a session") {
    val testStartTime = System.currentTimeMillis

    for
      session <- Sessions
        .start(makeTestSession(testDataFixture().task._id))
        .orFail
      result <- Sessions.stop(session._id).orFail
      _ = assert(result.endTime.get.getValue >= testStartTime)
    yield ()
  }

  test("should not stop a session of a task of another user") {
    otherUser.use(otherUser =>
      Sessions
        .start(makeTestSession(testDataFixture().task._id))
        .flatMap { session =>
          given User = otherUser
          Sessions.stop(session._id)
        }
        .assertEquals(Left(Error(Status.NotFound, __.ErrorSessionNotFound)))
    )
  }

  def sessionsList = Resource.make {
    val now = System.currentTimeMillis

    val sessions = List(
      makeTestSession(
        testDataFixture().task._id,
        startTime = Some(BsonDateTime(now + 0).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        startTime = Some(BsonDateTime(now + 100).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        startTime = Some(BsonDateTime(now + 200).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        startTime = Some(BsonDateTime(now + 300).toISOString)
      ),
      makeTestSession(
        testDataFixture().task._id,
        startTime = Some(BsonDateTime(now + 400).toISOString)
      )
    )

    import cats.syntax.parallel.*

    Sessions.collection
      .use(_.raw(_.deleteMany(Filter.empty)))
      .flatMap(_ =>
        sessions
          .map(Sessions.start(_).orFail)
          .parSequence
          .map(_.sortWith(_.startTime.getValue < _.startTime.getValue))
      )
  }(_ => Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))).void)

  test("should get the sessions of a task (asc)") {
    sessionsList.use(sessions =>
      Sessions
        .getSessions(
          testDataFixture().task._id,
          CursorQueryAsc(
            none[String],
            Some(PositiveInteger.unsafe(2)),
            Some(sessions.head.startTime.toISOString)
          )
        )
        .orFail
        .assertEquals(
          Cursor(
            PageInfo(
              5,
              Some(sessions(1).startTime.toISOString),
              Some(sessions(2).startTime.toISOString),
              true,
              true
            ),
            sessions
              .slice(1, 3)
              .map(session => Edge(session, session.startTime.toISOString))
          )
        )
    )
  }

  test("should get the sessions of a task (desc)") {}
  test("should not get the sessions of a task of another user") {}
  test("should update a session") {}
  test("should not update a session of a task of another user") {}
  test("should not accept a new task if it is of another user") {}
  test("should delete a session") {}
  test("should not delete a session of a task of another user") {}
}
