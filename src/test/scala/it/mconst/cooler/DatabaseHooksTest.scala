package it.mconst.cooler

import munit.CatsEffectSuite
import it.mconst.cooler.utils.TestUtils.*

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.project.DbProject
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.session.Session
import it.mconst.cooler.models.session.Sessions
import it.mconst.cooler.models.task.DbTask
import it.mconst.cooler.models.task.Task
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.tax.Tax
import it.mconst.cooler.models.tax.Taxes
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import munit.Assertions
import org.bson.BsonDateTime
import org.http4s.Status

class DatabaseHooksTest extends CatsEffectSuite {
  val adminFixture = ResourceSuiteLocalFixture(
    "admin",
    Resource.make {
      given Option[User] = none[User]
      Users
        .create(
          User.CreationData(
            "Database hooks test admin",
            "database-hooks-test-admin@example.com",
            "Som3P4ssw0rd!"
          )
        )
        .orFail
    }(_ =>
      Users.collection
        .use(_.raw(_.deleteMany(Filter.empty)))
        .both(Clients.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Taxes.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .void
    )
  )

  override val munitFixtures = Seq(adminFixture)

  given Lang = Lang.Default
  given Assertions = this

  test("should update the task and project when a session is created") {
    given User = adminFixture()

    for
      client <- Clients
        .create(
          makeTestPrivateClient(addressEmail =
            "session-create-hook-test@example.com"
          )
        )
        .orFail
      project <- Projects
        .create(
          makeTestProject(client._id, name = "Session create hook test")
        )
        .orFail
      task <- Tasks
        .create(
          makeTestTask(project._id, name = "Session create hook test")
        )
        .orFail
      _ <- IO.delay(Thread.sleep(500))
      session <- Sessions.start(makeTestSession(task._id)).orFail
      updatedTask <- Tasks.findById(task._id).orFail
      updatedProject <- Projects.findById(project._id).orFail
      _ = assert(
        updatedTask.updatedAt.getValue - task.updatedAt.getValue >= 500L
      )
      _ = assert(
        updatedProject.updatedAt.getValue - project.updatedAt.getValue >= 500L
      )
      _ <- Clients.collection
        .use(_.raw(_.deleteMany(Filter.empty)))
        .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))))
    yield ()
  }

  test(
    "should update the task and project when a session is updated"
  ) {
    given User = adminFixture()

    for
      client <- Clients
        .create(
          makeTestPrivateClient(addressEmail =
            "session-update-hook-test@example.com"
          )
        )
        .orFail
      project <- Projects
        .create(
          makeTestProject(client._id, name = "Session update hook test")
        )
        .orFail
      task <- Tasks
        .create(
          makeTestTask(project._id, name = "Session update hook test")
        )
        .orFail
      session <- Sessions.start(makeTestSession(task._id)).orFail
      _ <- IO.delay(Thread.sleep(500))
      _ <- Sessions
        .update(
          session._id,
          Session.InputData(task._id.toHexString, none[String], none[String])
        )
        .orFail
      updatedTask <- Tasks.findById(task._id).orFail
      updatedProject <- Projects.findById(project._id).orFail
      _ = assert(
        updatedTask.updatedAt.getValue - task.updatedAt.getValue >= 500L
      )
      _ = assert(
        updatedProject.updatedAt.getValue - project.updatedAt.getValue >= 500L
      )
      _ <- Clients.collection
        .use(_.raw(_.deleteMany(Filter.empty)))
        .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))))
    yield ()
  }

  test("should update the project when a task is created") {
    given User = adminFixture()

    for
      client <- Clients
        .create(
          makeTestPrivateClient(addressEmail =
            "task-create-hook-test@example.com"
          )
        )
        .orFail
      project <- Projects
        .create(
          makeTestProject(client._id, name = "Task create hook test")
        )
        .orFail
      _ <- IO.delay(Thread.sleep(500))
      task <- Tasks
        .create(
          makeTestTask(project._id, name = "Task create hook test")
        )
        .orFail
      updatedProject <- Projects.findById(project._id).orFail
      _ = assert(
        updatedProject.updatedAt.getValue - project.updatedAt.getValue >= 500L
      )
      _ <- Clients.collection
        .use(_.raw(_.deleteMany(Filter.empty)))
        .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
    yield ()
  }

  test("should update the project when a task is updated") {
    given User = adminFixture()

    for
      client <- Clients
        .create(
          makeTestPrivateClient(addressEmail =
            "task-create-hook-test@example.com"
          )
        )
        .orFail
      project <- Projects
        .create(
          makeTestProject(client._id, name = "Task create hook test")
        )
        .orFail
      task <- Tasks
        .create(
          makeTestTask(project._id, name = "Task create hook test")
        )
        .orFail
      _ <- IO.delay(Thread.sleep(500))
      _ <- Tasks
        .update(
          task._id,
          Task.InputData(
            project._id.toHexString,
            "Updated task",
            none[String],
            BsonDateTime(System.currentTimeMillis).toISOString,
            10f,
            10f
          )
        )
        .orFail
      updatedProject <- Projects.findById(project._id).orFail
      _ = assert(
        updatedProject.updatedAt.getValue - project.updatedAt.getValue >= 500L
      )
      _ <- Clients.collection
        .use(_.raw(_.deleteMany(Filter.empty)))
        .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
    yield ()
  }

  test("should delete the sessions when a task is deleted") {
    given User = adminFixture()

    for
      client <- Clients
        .create(
          makeTestPrivateClient(addressEmail =
            "task-delete-hook-test@example.com"
          )
        )
        .orFail
      project <- Projects
        .create(
          makeTestProject(client._id, name = "Task delete hook test")
        )
        .orFail
      task <- Tasks
        .create(
          makeTestTask(project._id, name = "Task delete hook test")
        )
        .orFail
      session <- Sessions.start(makeTestSession(task._id)).orFail
      _ <- Tasks.delete(task._id).orFail
      _ <- Sessions.collection
        .use(
          _.raw(_.find(Filter.eq("task", task._id)).all)
        )
        .map(_.size)
        .assertEquals(0)
      _ <- Clients.collection
        .use(_.raw(_.deleteMany(Filter.empty)))
        .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))))
    yield ()
  }

  test("should delete the tasks and the sessions when a project is deleted") {
    given User = adminFixture()

    for
      client <- Clients
        .create(
          makeTestPrivateClient(addressEmail =
            "task-delete-hook-test@example.com"
          )
        )
        .orFail
      project <- Projects
        .create(
          makeTestProject(client._id, name = "Task delete hook test")
        )
        .orFail
      task <- Tasks
        .create(
          makeTestTask(project._id, name = "Task delete hook test")
        )
        .orFail
      session <- Sessions.start(makeTestSession(task._id)).orFail
      _ <- Projects.delete(project._id).orFail
      _ <- Tasks.collection
        .use(_.findOne[DbTask](Filter.eq("_id", task._id)))
        .assertEquals(Left(Error(Status.NotFound, __.ErrorDocumentNotFound)))
      _ <- Sessions.collection
        .use(
          _.raw(_.find(Filter.eq("task", task._id)).all)
        )
        .map(_.size)
        .assertEquals(0)
      _ <- Clients.collection
        .use(_.raw(_.deleteMany(Filter.empty)))
        .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))))
    yield ()
  }

  test(
    "should delete the projects, tasks and sessions when a client is deleted"
  ) {
    given User = adminFixture()

    for
      client <- Clients
        .create(
          makeTestPrivateClient(addressEmail =
            "client-delete-hook-test@example.com"
          )
        )
        .orFail
      project <- Projects
        .create(
          makeTestProject(client._id, name = "Client delete hook test")
        )
        .orFail
      task <- Tasks
        .create(
          makeTestTask(project._id, name = "Client delete hook test")
        )
        .orFail
      session <- Sessions.start(makeTestSession(task._id)).orFail
      _ <- Clients.delete(client._id).orFail
      _ <- Projects.collection
        .use(_.findOne[DbProject](Filter.eq("_id", project._id)))
        .assertEquals(Left(Error(Status.NotFound, __.ErrorDocumentNotFound)))
      _ <- Tasks.collection
        .use(_.findOne[DbTask](Filter.eq("_id", task._id)))
        .assertEquals(Left(Error(Status.NotFound, __.ErrorDocumentNotFound)))
      _ <- Sessions.collection
        .use(
          _.raw(_.find(Filter.eq("task", task._id)).all)
        )
        .map(_.size)
        .assertEquals(0)
      _ <- Clients.collection
        .use(_.raw(_.deleteMany(Filter.empty)))
        .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
        .both(Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))))
    yield ()
  }

  test(
    "should delete the clients, projects, tasks, sessions and taxes when a user is deleted"
  ) {
    given Option[User] = Some(adminFixture())

    Users
      .create(
        User.CreationData(
          "User delete hook test",
          "user-delete-hook-test@example.com",
          "S0m3P4ssw0rd!"
        )
      )
      .orFail
      .flatMap { user =>
        given User = user

        for
          client <- Clients
            .create(
              makeTestPrivateClient(addressEmail =
                "user-delete-hook-test@example.com"
              )
            )
            .orFail
          project <- Projects
            .create(
              makeTestProject(client._id, name = "User delete hook test")
            )
            .orFail
          task <- Tasks
            .create(
              makeTestTask(project._id, name = "User delete hook test")
            )
            .orFail
          tax <- Taxes
            .create(
              makeTestTax("User delete hook test", .42)
            )
            .orFail
          session <- Sessions.start(makeTestSession(task._id)).orFail
          _ <- Users.delete.orFail
          _ <- Clients.collection
            .use(_.findOne[Client](Filter.eq("_id", client._id)))
            .assertEquals(
              Left(Error(Status.NotFound, __.ErrorDocumentNotFound))
            )
          _ <- Projects.collection
            .use(_.findOne[DbProject](Filter.eq("_id", project._id)))
            .assertEquals(
              Left(Error(Status.NotFound, __.ErrorDocumentNotFound))
            )
          _ <- Tasks.collection
            .use(_.findOne[DbTask](Filter.eq("_id", task._id)))
            .assertEquals(
              Left(Error(Status.NotFound, __.ErrorDocumentNotFound))
            )
          _ <- Taxes.collection
            .use(_.findOne[Tax](Filter.eq("_id", tax._id)))
            .assertEquals(
              Left(Error(Status.NotFound, __.ErrorDocumentNotFound))
            )
          _ <- Sessions.collection
            .use(
              _.raw(_.find(Filter.eq("task", task._id)).all)
            )
            .map(_.size)
            .assertEquals(0)
          _ <- Clients.collection
            .use(_.raw(_.deleteMany(Filter.empty)))
            .both(Projects.collection.use(_.raw(_.deleteMany(Filter.empty))))
            .both(Tasks.collection.use(_.raw(_.deleteMany(Filter.empty))))
            .both(Sessions.collection.use(_.raw(_.deleteMany(Filter.empty))))
        yield ()
      }
  }
}
