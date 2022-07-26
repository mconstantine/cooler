package it.mconst.cooler.stats

import it.mconst.cooler.utils.TestUtils.*
import munit.CatsEffectSuite

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import cats.syntax.parallel.*
import com.osinka.i18n.Lang
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.project.ProjectCashData
import it.mconst.cooler.models.project.ProjectCashedBalance
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.project.ProjectWithClientLabel
import it.mconst.cooler.models.session.Sessions
import it.mconst.cooler.models.session.SessionWithTaskLabel
import it.mconst.cooler.models.task.DbTask
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.task.TaskWithProjectLabel
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.models.user.UserStats
import mongo4cats.collection.operations.Filter
import munit.Assertions
import org.bson.BsonDateTime

class StatsTest extends CatsEffectSuite {
  val now = System.currentTimeMillis

  val adminFixture = ResourceSuiteLocalFixture(
    "admin",
    Resource.make {
      given Option[User] = none[User]
      Users
        .create(
          User.CreationData(
            "Stats test admin",
            "stats-test-admin@example.com",
            "S0m3P4ssw0rd!"
          )
        )
        .orFail
    }(_ => Users.collection.use(_.raw(_.deleteMany(Filter.empty))).void)
  )

  override def munitFixtures = Seq(adminFixture)

  final case class TestData(
      client: Client,
      projects: List[ProjectWithClientLabel],
      tasks: List[TaskWithProjectLabel],
      sessions: List[SessionWithTaskLabel]
  )

  def testData = Resource.make(
    for
      client <- {
        given User = adminFixture()
        Clients
          .create(
            makeTestBusinessClient(addressEmail =
              "stats-test-client@example.com"
            )
          )
          .orFail
      }
      projects <- {
        given User = adminFixture()
        List(
          // Two cashed projects, one not cashed, two cashed out of the time range (one in the past, one
          // in the future)
          makeTestProject(
            client._id,
            name = "Stats test project 1",
            cashData =
              Some(ProjectCashData(BsonDateTime(now - 3600000 * 20), 100))
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 2",
            cashData =
              Some(ProjectCashData(BsonDateTime(now - 3600000 * 10), 100))
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 3",
            cashData = none[ProjectCashData]
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 4",
            cashData =
              Some(ProjectCashData(BsonDateTime(now - 3600000 * 100), 100))
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 5",
            cashData =
              Some(ProjectCashData(BsonDateTime(now + 3600000 * 5), 100))
          )
        )
          .map(Projects.create(_).orFail)
          .parSequence
      }
      tasks <- {
        given User = adminFixture()
        List(
          makeTestTask(
            projects(0)._id,
            name = "Stats test task 11",
            expectedWorkingHours = 10,
            hourlyCost = 10,
            startTime = BsonDateTime(now - 3600000 * 20).toISOString
          ),
          makeTestTask(
            projects(0)._id,
            name = "Stats test task 12",
            expectedWorkingHours = 10,
            hourlyCost = 10,
            startTime = BsonDateTime(now - 3600000 * 10).toISOString
          ),
          makeTestTask(
            projects(1)._id,
            name = "Stats test task 21",
            expectedWorkingHours = 10,
            hourlyCost = 10,
            startTime = BsonDateTime(now - 3600000 * 5).toISOString
          ),
          makeTestTask(
            projects(1)._id,
            name = "Stats test task 22",
            expectedWorkingHours = 10,
            hourlyCost = 10,
            startTime = BsonDateTime(now - 3600000 * 100).toISOString
          )
        )
          .map(Tasks.create(_).orFail)
          .parSequence
      }
      sessions <- {
        given User = adminFixture()
        List(
          // Ten hours on task 0 (project 0)
          makeTestSession(
            tasks(0)._id,
            startTime = Some(BsonDateTime(now - 3600000 * 20).toISOString),
            endTime = Some(BsonDateTime(now - 3600000 * 10).toISOString)
          ),
          // Seven hours in two different sessions on task 1 (project 0)
          makeTestSession(
            tasks(1)._id,
            startTime = Some(BsonDateTime(now - 3600000 * 10).toISOString),
            endTime = Some(BsonDateTime(now - 3600000 * 5).toISOString)
          ),
          makeTestSession(
            tasks(1)._id,
            startTime = Some(BsonDateTime(now - 3600000 * 5).toISOString),
            endTime = Some(BsonDateTime(now - 3600000 * 3).toISOString)
          ),
          makeTestSession(
            tasks(2)._id,
            startTime = Some(BsonDateTime(now - 3600000 * 5).toISOString),
            endTime = Some(BsonDateTime(now - 3600000 * 0).toISOString)
          ),
          // Two sessions out of the time range (one in the past, one in the future)
          makeTestSession(
            tasks(3)._id,
            startTime = Some(BsonDateTime(now - 3600000 * 100).toISOString),
            endTime = Some(BsonDateTime(now - 3600000 * 95).toISOString)
          ),
          makeTestSession(
            tasks(3)._id,
            startTime = Some(BsonDateTime(now + 3600000 * 0).toISOString),
            endTime = Some(BsonDateTime(now + 3600000 * 5).toISOString)
          )
        )
          .map(Sessions.start(_).orFail)
          .parSequence
      }
    yield TestData(client, projects, tasks, sessions)
  )(_ =>
    Clients.collection
      .use(_.raw(_.deleteMany(Filter.empty)))
      .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
      .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
      .both(Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))))
      .void
  )

  given Lang = Lang.Default
  given Assertions = this

  test("should get the stats of a user (empty)") {
    given User = adminFixture()
    Users
      .getStats(BsonDateTime(now - 3600000 * 100), none[BsonDateTime])
      .assertEquals(UserStats.empty)
  }

  test("should get the stats of a user (with data)") {
    testData.use { _ =>
      given User = adminFixture()

      Users
        .getStats(BsonDateTime(now - 3600000 * 50), none[BsonDateTime])
        .assertEquals(
          UserStats(
            NonNegativeFloat.unsafe(30f),
            NonNegativeFloat.unsafe(22f),
            NonNegativeFloat.unsafe(300f),
            NonNegativeFloat.unsafe(220f)
          )
        )
    }
  }

  test("should get the balance of the projects of a user (empty)") {
    given User = adminFixture()
    Projects
      .getCashedBalance(BsonDateTime(now - 3600000 * 100), none[BsonDateTime])
      .assertEquals(ProjectCashedBalance(NonNegativeFloat.unsafe(0f)))
  }

  test("should get the balance of the projects of a user (with data)") {
    testData.use { _ =>
      given User = adminFixture()

      Projects
        .getCashedBalance(BsonDateTime(now - 3600000 * 50), none[BsonDateTime])
        .assertEquals(ProjectCashedBalance(NonNegativeFloat.unsafe(200f)))
    }
  }

  test("should get the stats of a project (empty)") {
    given User = adminFixture()

    testData.use { data =>
      for
        project <- Projects
          .create(
            makeTestProject(
              data.client._id,
              name = "Project stats empty test"
            )
          )
          .orFail
        result <- Projects.findById(project._id).orFail
        _ = assertEquals(result.expectedWorkingHours.toFloat, 0f)
        _ = assertEquals(result.actualWorkingHours.toFloat, 0f)
        _ = assertEquals(result.budget.toFloat, 0f)
        _ = assertEquals(result.balance.toFloat, 0f)
      yield ()
    }
  }

  test("should get the stats of a project (with data)") {
    testData.use { data =>
      given User = adminFixture()

      for
        result <- Projects.findById(data.projects(0)._id).orFail
        _ = assertEquals(result.expectedWorkingHours.toFloat, 20f)
        _ = assertEquals(result.actualWorkingHours.toFloat, 17f)
        _ = assertEquals(result.budget.toFloat, 200f)
        _ = assertEquals(result.balance.toFloat, 170f)
      yield ()
    }
  }

  test("should get the actual working hours of a task (empty)") {
    testData.use { data =>
      given User = adminFixture()

      for
        task <- Tasks.create(makeTestTask(data.projects(0)._id)).orFail
        _ <- Tasks
          .findById(task._id)
          .orFail
          .map(_.actualWorkingHours.toFloat)
          .assertEquals(0f)
        _ <- Tasks.delete(task._id).orFail
      yield ()
    }
  }

  test("should get the actual working hours of a task (with data)") {
    testData.use { data =>
      given User = adminFixture()

      Tasks
        .findById(data.tasks(1)._id)
        .orFail
        .map(_.actualWorkingHours.toFloat)
        .assertEquals(7f)
    }
  }
}
