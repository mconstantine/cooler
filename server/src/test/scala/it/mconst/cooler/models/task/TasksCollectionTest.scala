package it.mconst.cooler.models.task

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
import it.mconst.cooler.models.project.Project
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.session.Sessions
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import java.time.format.DateTimeFormatter
import java.time.LocalDateTime
import java.time.ZoneOffset
import mongo4cats.bson.ObjectId
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.Status

class TasksCollectionTest extends IOSuite {
  final case class TestData(user: User, client: Client, project: Project)

  val testDataFixture = IOFixture(
    "testData",
    Resource.make {
      given Option[User] = none[User]

      for
        admin <- Users
          .create(
            User.CreationData(
              "Task collection test admin",
              "task-test-admin@example.com",
              "S0m3P4ssw0rd!?"
            )
          )
          .orFail
        client <- {
          given User = admin

          Clients
            .create(makeTestBusinessClient())
            .orFail
        }
        project <- {
          given User = admin

          Projects
            .create(makeTestProject(client._id))
            .orFail
        }
      yield TestData(admin, client, project)
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

  given User = testDataFixture().user
  given Lang = Lang.Default

  test("should create a task") {
    val data =
      makeTestTask(
        testDataFixture().project._id,
        name = "Task creation test"
      )

    Tasks.create(data).orFail.map(_.name.toString).assertEquals(data.name)
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

  test("should reject creation of tasks of clients of other users") {
    val data =
      makeTestTask(
        testDataFixture().project._id,
        name = "Task creation exclusivity test"
      )

    otherUser.use { user =>
      given User = user
      Tasks
        .create(data)
        .assertEquals(
          Left(Error(Status.NotFound, __.ErrorProjectNotFound))
        )
    }
  }

  test("should find a task by id") {
    val data = makeTestTask(
      testDataFixture().project._id,
      name = "Task find by id test"
    )

    for
      task <- Tasks.create(data).orFail
      result <- Tasks.findById(task._id).orFail
      _ = assert(result.name == data.name)
      _ = assert(
        result.project._id == testDataFixture().project._id
      )
    yield ()
  }

  test("should not find a task of a client of another user by id") {
    val data = makeTestTask(
      testDataFixture().project._id,
      name = "Task find by id exclusivity test"
    )

    otherUser.use { user =>
      for
        task <- Tasks.create(data).orFail
        _ <- {
          given User = user
          Tasks
            .findById(task._id)
            .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
        }
      yield ()
    }
  }

  def tasksList = Resource.make {
    val project = testDataFixture().project

    val tasks: List[Task.InputData] = List(
      makeTestTask(
        project._id,
        startTime = BsonDateTime(
          LocalDateTime
            .of(2000, 1, 1, 9, 30)
            .toEpochSecond(ZoneOffset.UTC) * 1000
        ).toISOString
      ),
      makeTestTask(
        project._id,
        startTime = BsonDateTime(
          LocalDateTime
            .of(2000, 1, 2, 9, 30)
            .toEpochSecond(ZoneOffset.UTC) * 1000
        ).toISOString
      ),
      makeTestTask(
        project._id,
        startTime = BsonDateTime(
          LocalDateTime
            .of(2000, 1, 3, 9, 30)
            .toEpochSecond(ZoneOffset.UTC) * 1000
        ).toISOString
      ),
      makeTestTask(
        project._id,
        startTime = BsonDateTime(
          LocalDateTime
            .of(2000, 1, 4, 9, 30)
            .toEpochSecond(ZoneOffset.UTC) * 1000
        ).toISOString
      ),
      makeTestTask(
        project._id,
        startTime = BsonDateTime(
          LocalDateTime
            .of(2000, 1, 5, 9, 30)
            .toEpochSecond(ZoneOffset.UTC) * 1000
        ).toISOString
      ),
      makeTestTask(
        project._id,
        startTime = BsonDateTime(
          LocalDateTime
            .of(2000, 1, 6, 9, 30)
            .toEpochSecond(ZoneOffset.UTC) * 1000
        ).toISOString
      )
    )

    Tasks.collection.use(
      _.raw(_.deleteMany(Filter.empty)).flatMap(_ =>
        tasks.traverse(Tasks.create(_).orFail)
      )
    )
  }(_ => Tasks.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find a task") {
    tasksList.use { tasks =>
      for
        result <- Tasks
          .find(
            CursorNoQueryAsc(
              first = Some(PositiveInteger.unsafe(2)),
              after = Some(tasks(1).startTime.toISOString)
            ),
            none[ObjectId]
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 6)
        _ = assertEquals(
          result.pageInfo.startCursor,
          Some(tasks(2).startTime.toISOString)
        )
        _ = assertEquals(
          result.pageInfo.endCursor,
          Some(tasks(3).startTime.toISOString)
        )
        _ = assertEquals(result.pageInfo.hasPreviousPage, true)
        _ = assertEquals(result.pageInfo.hasNextPage, true)
        _ = assertEquals(result.edges.length, 2)
        _ = assertEquals(
          result.edges.map(_.node._id),
          List(tasks(2)._id, tasks(3)._id)
        )
      yield ()
    }
  }

  test("should find the next task") {
    tasksList.use(tasks =>
      Tasks
        .getNext(tasks(1)._id)
        .orFail
        .map(_._id)
        .assertEquals(tasks(2)._id)
    )
  }

  test("should find the previous task") {
    tasksList.use(tasks =>
      Tasks
        .getPrevious(tasks(1)._id)
        .orFail
        .map(_._id)
        .assertEquals(tasks(0)._id)
    )
  }

  test("should find tasks by project") {
    tasksList.use { _ =>
      for
        otherProject <- Projects
          .create(
            makeTestProject(testDataFixture().client._id)
          )
          .orFail
        task <- Tasks.create(makeTestTask(otherProject._id)).orFail
        result <- Tasks
          .find(
            CursorNoQueryAsc(
              first = Some(PositiveInteger.unsafe(10)),
              after = none[String]
            ),
            Some(otherProject._id)
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 1)
        _ = assertEquals(result.edges.map(_.node._id), List(task._id))
      yield ()
    }
  }

  test("should not include tasks of clients of other users when searching") {
    tasksList.use { _ =>
      otherUser.use { user =>
        given User = user

        for
          client <- Clients.create(makeTestBusinessClient()).orFail
          project <- Projects.create(makeTestProject(client._id)).orFail
          task <- Tasks.create(makeTestTask(project._id, name = "Adam")).orFail
          result <- Tasks
            .find(CursorNoQueryAsc(), none[ObjectId])
            .orFail
            .map(_.edges.map(_.node.name.toString))
          _ = assertEquals(result, List("Adam"))
        yield ()
      }
    }
  }

  test("should get tasks due today") {
    val currentUserProject = testDataFixture().project
    val now = LocalDateTime.now

    val todayAtMidnight = LocalDateTime.of(
      now.getYear(),
      now.getMonth(),
      now.getDayOfMonth(),
      0,
      0,
      0
    )

    val todayAt9AM = LocalDateTime.of(
      now.getYear(),
      now.getMonth(),
      now.getDayOfMonth(),
      9,
      0,
      0
    )

    val todayAt10AM = LocalDateTime.of(
      now.getYear(),
      now.getMonth(),
      now.getDayOfMonth(),
      10,
      0,
      0
    )

    val todayAt11AM = LocalDateTime.of(
      now.getYear(),
      now.getMonth(),
      now.getDayOfMonth(),
      11,
      0,
      0
    )

    val yesterdayAt9AM = todayAt9AM.minusDays(1)
    val tomorrowAtMidnight = todayAtMidnight.plusDays(1)
    val tomorrowAt9AM = todayAt9AM.plusDays(1)

    otherUser.use { otherUser =>
      for
        otherUserClient <- {
          given User = otherUser
          Clients.create(makeTestBusinessClient()).orFail
        }
        otherUserProject <- {
          given User = otherUser
          Projects.create(makeTestProject(otherUserClient._id)).orFail
        }
        // Create three tasks today, one being of another user, one task yesterday, one task tomorrow
        tasksData = List(
          makeTestTask(
            currentUserProject._id,
            startTime = BsonDateTime(
              todayAt9AM.toEpochSecond(ZoneOffset.UTC) * 1000
            ).toISOString
          ),
          makeTestTask(
            currentUserProject._id,
            startTime = BsonDateTime(
              todayAt10AM.toEpochSecond(ZoneOffset.UTC) * 1000
            ).toISOString
          ),
          makeTestTask(
            otherUserProject._id,
            startTime = BsonDateTime(
              todayAt11AM.toEpochSecond(ZoneOffset.UTC) * 1000
            ).toISOString
          ),
          makeTestTask(
            currentUserProject._id,
            startTime = BsonDateTime(
              yesterdayAt9AM.toEpochSecond(ZoneOffset.UTC) * 1000
            ).toISOString
          ),
          makeTestTask(
            currentUserProject._id,
            startTime = BsonDateTime(
              tomorrowAt9AM.toEpochSecond(ZoneOffset.UTC) * 1000
            ).toISOString
          )
        )
        _ <- Tasks.collection.use(_.raw(_.deleteMany(Filter.empty)))
        currentUserTasks <- List(
          tasksData(0),
          tasksData(1),
          tasksData(3),
          tasksData(4)
        ).traverse(Tasks.create(_)).orFail
        _ <- {
          given User = otherUser
          Tasks.create(tasksData(2)).orFail
        }
        result <- Tasks
          .getDue(
            BsonDateTime(todayAtMidnight.toEpochSecond(ZoneOffset.UTC) * 1000),
            Some(
              BsonDateTime(
                tomorrowAtMidnight.toEpochSecond(ZoneOffset.UTC) * 1000
              )
            )
          )
          .map(List.from(_).map(_._id))
          .assertEquals(currentUserTasks.slice(0, 2).map(_._id))
        _ <- Tasks.collection.use(_.raw(_.deleteMany(Filter.empty)))
      yield ()
    }
  }

  test("should update a task") {
    val client = testDataFixture().client
    val originalProject = testDataFixture().project

    val data = makeTestTask(
      originalProject._id,
      name = "Update full test",
      description = Some("Description")
    )

    val newClientData =
      makeTestPrivateClient(addressEmail =
        "task-update-test-client@example.com"
      )

    for
      newClient <- Clients.create(newClientData).orFail
      newProject <- {
        Projects
          .create(makeTestProject(newClient._id, name = "New task project"))
          .orFail
      }
      task <- Tasks.create(data).orFail
      update = Task.InputData(
        newProject._id.toString,
        "Updated name",
        none[String],
        BsonDateTime(System.currentTimeMillis).toISOString,
        task.expectedWorkingHours.toFloat + 10f,
        task.hourlyCost.toFloat + 10f
      )
      _ <- IO.delay(Thread.sleep(500))
      updated <- Tasks.update(task._id, update).orFail
      _ = assertEquals(updated.client._id, newClient._id)
      _ = assertEquals(updated.project._id.toHexString, update.project)
      _ = assertEquals(updated.name.toString, update.name)
      _ = assertEquals(updated.description.map(_.toString), none[String])
      _ = assertEquals(
        updated.expectedWorkingHours.toFloat,
        update.expectedWorkingHours
      )
      _ = assertEquals(updated.hourlyCost.toFloat, update.hourlyCost)
    yield ()
  }

  test("should not update a task of another user") {
    otherUser.use { otherUser =>
      val data = makeTestTask(
        testDataFixture().project._id,
        name = "Update exclusivity test"
      )

      for
        task <- Tasks.create(data).orFail
        _ <- {
          given User = otherUser

          Tasks
            .update(task._id, makeTestTask(testDataFixture().project._id))
            .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
        }
      yield ()
    }
  }

  test("should not accept an updated project if it is of another user") {
    otherUser.use { otherUser =>
      val testData = testDataFixture()
      val user = testData.user
      val project = testData.project

      val taskData = makeTestTask(
        project._id,
        name = "Update exclusivity test"
      )

      for
        task <- Tasks.create(taskData).orFail
        otherUserClient <- {
          given User = otherUser
          Clients.create(makeTestPrivateClient()).orFail
        }
        otherUserProject <- {
          given User = otherUser
          Projects.create(makeTestProject(otherUserClient._id)).orFail
        }
        taskUpdateData = makeTestTask(otherUserProject._id)
        _ <- Tasks
          .update(task._id, taskUpdateData)
          .assertEquals(Left(Error(Status.NotFound, __.ErrorProjectNotFound)))
      yield ()
    }
  }

  test("should delete a task") {
    val data = makeTestTask(testDataFixture().project._id, name = "Delete test")

    for
      task <- Tasks.create(data).orFail
      _ <- Tasks.delete(task._id).orFail.map(_._id).assertEquals(task._id)
      _ <- Tasks
        .findById(task._id)
        .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
    yield ()
  }

  test("should not delete a task of another user") {
    otherUser.use { otherUser =>
      val data = makeTestTask(
        testDataFixture().project._id,
        name = "Delete exclusivity test"
      )

      for
        task <- Tasks.create(data).orFail
        _ <- {
          given User = otherUser

          Tasks
            .delete(task._id)
            .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
        }
      yield ()
    }
  }

  test("should truncate tasks and sessions of a project and a user") {
    otherUser.use(otherUser => {
      for
        _ <- Tasks.collection.use(_.raw(_.deleteMany(Filter.empty)))
        task1 <- Tasks
          .create(makeTestTask(testDataFixture().project._id))
          .orFail
        task2 <- Tasks
          .create(makeTestTask(testDataFixture().project._id))
          .orFail
        session1 <- Sessions.start(makeTestSession(task1._id)).orFail
        session2 <- Sessions.start(makeTestSession(task2._id)).orFail
        otherUserClient <- {
          given User = otherUser
          Clients
            .create(makeTestPrivateClient())
            .orFail
        }
        otherUserProject <- {
          given User = otherUser
          Projects
            .create(makeTestProject(otherUserClient._id))
            .orFail
        }
        otherUserTask <- {
          given User = otherUser
          Tasks
            .create(makeTestTask(otherUserProject._id))
            .orFail
        }
        otherUserSession <- {
          given User = otherUser
          Sessions
            .start(makeTestSession(otherUserTask._id))
            .orFail
        }
        result <- Tasks.truncate(testDataFixture().project._id).orFail
        _ = assertEquals(result.deletedCount, 2L)
        _ <- Tasks
          .findById(task1._id)
          .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
        _ <- Tasks
          .findById(task2._id)
          .assertEquals(Left(Error(Status.NotFound, __.ErrorTaskNotFound)))
        _ <- Sessions
          .findById(session1._id)
          .assertEquals(Left(Error(Status.NotFound, __.ErrorSessionNotFound)))
        _ <- Sessions
          .findById(session2._id)
          .assertEquals(Left(Error(Status.NotFound, __.ErrorSessionNotFound)))
        _ <- {
          given User = otherUser
          Tasks
            .findById(otherUserTask._id)
            .orFail
            .map(_._id)
            .assertEquals(otherUserTask._id)
        }
        _ <- {
          given User = otherUser
          Sessions
            .findById(otherUserSession._id)
            .orFail
            .map(_._id)
            .assertEquals(otherUserSession._id)
        }
      yield ()
    })
  }
}
