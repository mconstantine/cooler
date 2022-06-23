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
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import java.time.format.DateTimeFormatter
import java.time.LocalDateTime
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.Status

class TasksCollectionTest extends CatsEffectSuite {
  final case class TestData(user: User, client: Client, project: Project)

  val testDataFixture = ResourceSuiteLocalFixture(
    "testData",
    Resource.make {
      given Option[User] = none[User]

      for
        admin <- Users
          .register(
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
  given Assertions = this

  test("should create a task") {
    val data =
      makeTestTask(
        testDataFixture().project._id,
        name = "Task creation test"
      )

    Tasks.create(data).orFail.map(_.asDbTask.name).assertEquals(data.name)
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
      _ = assert(result.asTaskWithProject.name == data.name)
      _ = assert(
        result.asTaskWithProject.project._id == testDataFixture().project._id
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
      makeTestTask(project._id, name = "Alice"),
      makeTestTask(project._id, name = "Bob"),
      makeTestTask(project._id, name = "Charlie"),
      makeTestTask(project._id, name = "Daniel"),
      makeTestTask(project._id, name = "Eleanor"),
      makeTestTask(project._id, name = "Frederick")
    )

    import cats.syntax.parallel.*

    Tasks.collection.use(_.raw(_.deleteMany(Filter.empty)).flatMap { _ =>
      tasks
        .map(Tasks.create(_).orFail)
        .parSequence
        .map(
          _.sortWith(_.asDbTask.name.toString < _.asDbTask.name.toString)
        )
    })
  }(_ => Tasks.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find a project") {
    tasksList.use { tasks =>
      for
        result <- Tasks
          .find(
            CursorQueryAsc(
              query = Some("a"),
              first = Some(2),
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
          List(tasks(2), tasks(3))
        )
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
            .find(CursorQueryAsc(query = Some("a")))
            .orFail
            .map(_.edges.map(_.node.asDbTask.name.toString))
          _ = assertEquals(result, List("Adam"))
        yield ()
      }
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

    val newProjectData =
      makeTestProject(client._id, name = "New task project")

    for
      newProject <- Projects.create(newProjectData).orFail.map(_.asDbProject)
      task <- Tasks.create(data).orFail
      update = Task.InputData(
        newProject._id.toString,
        "Updated name",
        none[String],
        BsonDateTime(System.currentTimeMillis).toISOString,
        task.asDbTask.expectedWorkingHours.toFloat + 10f,
        task.asDbTask.hourlyCost.toFloat + 10f
      )
      _ <- IO.delay(Thread.sleep(500))
      updated <- Tasks.update(task._id, update).orFail.map(_.asDbTask)
      _ = assertEquals(updated.project.toString, update.project)
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
      _ <- Tasks.delete(task._id).orFail.assertEquals(task)
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
}
