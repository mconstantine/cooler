package it.mconst.cooler.stats

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

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
import it.mconst.cooler.models.session.SessionWithLabels
import it.mconst.cooler.models.task.DbTask
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.task.TaskWithLabels
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.models.user.UserStats
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime

class StatsTest extends IOSuite {
  val now = System.currentTimeMillis

  val adminFixture = IOFixture(
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
      tasks: List[TaskWithLabels],
      sessions: List[SessionWithLabels]
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
          // Two cashed projects, two not cashed, two cashed out of the time range (one in the past, one
          // in the future). Project 3 has no tasks but it has an expected budget.
          makeTestProject(
            client._id,
            name = "Stats test project 1",
            cashData =
              Some(ProjectCashData(BsonDateTime(now - 3600000 * 20), 100)),
            startTime = BsonDateTime(now - 3600000 * 20).toISOString,
            endTime = BsonDateTime(now).toISOString
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 2",
            cashData =
              Some(ProjectCashData(BsonDateTime(now - 3600000 * 10), 100)),
            startTime = BsonDateTime(now - 3600000 * 5).toISOString,
            endTime = BsonDateTime(now).toISOString
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 3",
            expectedBudget = Some(50),
            startTime = BsonDateTime(now - 3600000 * 20).toISOString,
            endTime = BsonDateTime(now).toISOString
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 4",
            cashData = none[ProjectCashData],
            startTime = BsonDateTime(now - 3600000 * 20).toISOString,
            endTime = BsonDateTime(now).toISOString
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 5",
            cashData =
              Some(ProjectCashData(BsonDateTime(now - 3600000 * 100), 100)),
            expectedBudget = Some(100),
            startTime = BsonDateTime(now - 3600000 * 100).toISOString,
            endTime = BsonDateTime(now).toISOString
          ),
          makeTestProject(
            client._id,
            name = "Stats test project 6",
            cashData =
              Some(ProjectCashData(BsonDateTime(now + 3600000 * 5), 100)),
            expectedBudget = Some(100),
            startTime = BsonDateTime(now + 3600000 * 5).toISOString,
            endTime = BsonDateTime(now + 3600000 * 10).toISOString
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
            NonNegativeNumber.unsafe(30f),
            NonNegativeNumber.unsafe(22f),
            NonNegativeNumber.unsafe(350f),
            NonNegativeNumber.unsafe(220f)
          )
        )
    }
  }

  test("should get the balance of the projects of a user (empty)") {
    given User = adminFixture()
    Projects
      .getCashedBalance(BsonDateTime(now - 3600000 * 100), none[BsonDateTime])
      .assertEquals(ProjectCashedBalance(NonNegativeNumber.unsafe(0f)))
  }

  test("should get the balance of the projects of a user (with data)") {
    testData.use { _ =>
      given User = adminFixture()

      Projects
        .getCashedBalance(BsonDateTime(now - 3600000 * 50), none[BsonDateTime])
        .assertEquals(ProjectCashedBalance(NonNegativeNumber.unsafe(200f)))
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
        _ = assertEquals(result.expectedWorkingHours.toNumber, BigDecimal(0f))
        _ = assertEquals(result.actualWorkingHours.toNumber, BigDecimal(0f))
        _ = assertEquals(result.budget.toNumber, BigDecimal(0f))
        _ = assertEquals(result.balance.toNumber, BigDecimal(0f))
      yield ()
    }
  }

  test("should get the stats of a project (with data)") {
    testData.use { data =>
      given User = adminFixture()

      for
        result <- Projects.findById(data.projects(0)._id).orFail
        _ = assertEquals(result.expectedWorkingHours.toNumber, BigDecimal(20))
        _ = assertEquals(result.actualWorkingHours.toNumber, BigDecimal(17))
        _ = assertEquals(result.budget.toNumber, BigDecimal(200))
        _ = assertEquals(result.balance.toNumber, BigDecimal(170))
      yield ()
    }
  }

  test("should use project expected budget if no tasks are available") {
    testData.use { data =>
      given User = adminFixture()

      for
        result <- Projects.findById(data.projects(2)._id).orFail
        _ = assertEquals(result.budget.toNumber, BigDecimal(50))
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
          .map(_.actualWorkingHours.toNumber)
          .assertEquals(BigDecimal(0))
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
        .map(_.actualWorkingHours.toNumber)
        .assertEquals(BigDecimal(7))
    }
  }
}
