package it.mconst.cooler.routes

import it.mconst.cooler.utils.TestUtils._
import munit.{Assertions, CatsEffectSuite}

import cats.effect.IO
import cats.effect.kernel.Resource
import com.github.t3hnar.bcrypt._
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.{User, Users}
import it.mconst.cooler.models.user.given
import it.mconst.cooler.utils.{__, Error}
import it.mconst.cooler.utils.given
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.io._
import org.http4s.implicits._
import org.http4s.Request

class UserRoutesTest extends CatsEffectSuite {
  given Lang = Lang.Default
  given Assertions = this

  val app = UserRoutes().orNotFound
  val client: Client[IO] = Client.fromHttpApp(app)

  given Client[IO] = client

  val adminFixture = ResourceSuiteLocalFixture(
    "admin",
    Resource.make({
      val adminData: User.CreationData = User.CreationData(
        "User routes test admin",
        "user-routes-test-admin@example.com",
        "S0m3P4ssw0rd?!"
      )

      given Option[User] = None
      Users.register(adminData).orFail
    })(_ => Users.collection.use(_.drop))
  )

  override val munitFixtures = List(adminFixture)

  test("should get a user") {
    val admin = adminFixture()
    client.expect[User](GET(uri"/me").sign(admin)).assertEquals(admin)
  }

  test("should register a user given an existing user") {
    val admin = adminFixture()

    val userData = User.CreationData(
      "Authed register test",
      "authed-register-test@example.com",
      "S0m3Passw0rd?!"
    )

    POST(userData, uri"/")
      .sign(admin)
      .shouldRespondLike((user: User) => user.email, userData.email)
  }

  test("should reject an unsigned registration") {
    val userData = User.CreationData(
      "Anonymous register test",
      "anonymous-register-test@example.com",
      "S0m3Passw0rd?!"
    )

    app.assertError(
      POST(userData, uri"/"),
      Forbidden,
      __.ErrorInvalidAccessToken
    )
  }

  def testUserUpdate(testName: String, data: User.UpdateData): IO[Unit] = {
    val admin = adminFixture()

    val userData = User.CreationData(
      testName,
      s"${testName.toLowerCase.replaceAll("\\W+", "-")}@example.com",
      "S0m3Passw0rd?!"
    )

    val updateData = User.UpdateData(Some("Updated name"), None, None)

    for
      user <- client.expect[User](POST(userData, uri"/").sign(admin))
      _ <- IO.delay(Thread.sleep(100))
      update <- client.expect[User](PUT(updateData, uri"/me").sign(user))
      _ = assertEquals(
        update.name.toString,
        updateData.name.getOrElse(userData.name)
      )
      _ = assertEquals(
        update.email.toString,
        updateData.email.getOrElse(userData.email)
      )
      _ = assert(
        updateData.password
          .getOrElse(userData.password)
          .isBcryptedSafeBounded(update.password.toString)
          .getOrElse(false)
      )
      _ = assertNotEquals(user.updatedAt.getValue, update.updatedAt.getValue)
    yield ()
  }

  test("should update a user") {
    testUserUpdate(
      "Authed user update test",
      User.UpdateData(Some("Updated name"), None, None)
    )
  }

  test("should handle empty user updates") {
    testUserUpdate(
      "Empty user update test",
      User.UpdateData(None, None, None)
    )
  }

  test("should handle full user updates") {
    testUserUpdate(
      "Full user update test",
      User.UpdateData(
        Some("Updated name"),
        Some("update-email@example.com"),
        Some("Upd4t3dP4ssw0rd!")
      )
    )
  }

  test("should delete a user") {
    val admin = adminFixture()

    val userData = User.CreationData(
      "Delete user test",
      "delete-user-test@example.com",
      "S0m3P4ssw0rd?!"
    )

    for
      user <- client.expect[User](POST(userData, uri"/").sign(admin))
      result <- client.expect[User](DELETE(uri"/me").sign(user))
      _ = assertEquals(user._id, result._id)
      _ <- app.assertError(
        GET(uri"/me").sign(user),
        Forbidden,
        __.ErrorInvalidAccessToken
      )
    yield ()
  }
}
