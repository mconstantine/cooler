package it.mconst.cooler.models.task

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.project.Project
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.task.Task.BatchInputData
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import java.time.LocalDate
import org.bson.BsonDateTime
import scala.collection.JavaConverters.*

class TaskBatchTest extends IOSuite {
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

  given Lang = Lang.Default

  test("should work") {
    val data = BatchInputData(
      testDataFixture().project._id.toHexString(),
      "Repeated task",
      LocalDate.of(2018, 1, 1).toString() + "T09:00:00.000Z",
      8,
      25,
      LocalDate.of(2018, 1, 31).toString() + "T00:00:00.000Z",
      0x1111111
    )

    given User = testDataFixture().user

    for
      result <- Tasks
        .create(data)
        .orFail
        .map(List.from(_))
      _ = assertEquals(result.size, 31)
      _ = assertEquals(
        result
          .map(_.startTime.toISOString.slice(11, 24))
          .filter(_ == "09:00:00.000Z")
          .size,
        31
      )
    yield ()
  }

  test("should handle weekday repetition") {
    val data = BatchInputData(
      testDataFixture().project._id.toHexString(),
      "Weekday repetition test",
      LocalDate.of(2018, 1, 1).toString() + "T09:00:00.000Z",
      8,
      25,
      LocalDate.of(2018, 1, 7).toString() + "T09:00:00.000Z",
      0x1001011
    )

    given User = testDataFixture().user

    Tasks
      .create(data)
      .orFail
      .map(List.from(_))
      .map(_.map(_.startTime.toISOString))
      .assertEquals(
        List(
          "2018-01-01T09:00:00.000Z",
          "2018-01-02T09:00:00.000Z",
          "2018-01-04T09:00:00.000Z",
          "2018-01-07T09:00:00.000Z"
        )
      )
  }

  test("should expand date placeholders") {
    val data = BatchInputData(
      testDataFixture().project._id.toHexString(),
      "DDDD DDD DD D/MMMM MMM MM M/YYYY YY - Y dmy d m y YYYY",
      LocalDate.of(2018, 1, 1).toString() + "T09:00:00.000Z",
      8,
      25,
      LocalDate.of(2018, 1, 1).toString() + "T09:00:00.000Z",
      0x0000001
    )

    given User = testDataFixture().user

    Tasks
      .create(data)
      .orFail
      .map(List.from(_))
      .map(_.map(_.name.toString))
      .assertEquals(
        List(
          "Monday Mon 01 1/January Jan 01 1/2018 18 - Y dmy d m y 2018"
        )
      )
  }
}
