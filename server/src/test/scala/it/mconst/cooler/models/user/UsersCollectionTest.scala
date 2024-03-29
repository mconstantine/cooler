package it.mconst.cooler.models.user

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.*
import cats.syntax.all.none
import com.github.t3hnar.bcrypt.*
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.Email
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.Status

class UsersCollectionTest extends IOSuite {
  given Lang = Lang.Default

  val cleanUsersCollection =
    Resource.make(IO.unit)(_ =>
      Users.collection.use(_.raw(_.deleteMany(Filter.empty).void))
    )

  test("should register a user") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Registration test",
        "registration-test@example.com",
        "Abc123!?"
      )

      given Option[User] = none[User]

      for
        user <- Users.create(userData).orFail
        _ = assertEquals(user.email.toString, userData.email)
        _ = assert(user.password != userData.password)
        _ = assert(
          userData.password
            .isBcryptedSafeBounded(user.password.toString)
            .getOrElse(false)
        )
      yield ()
    }
  }

  test(
    "should reject registration if there is a user already registered and no customer"
  ) {
    cleanUsersCollection.use { _ =>
      val firstUser = User.CreationData(
        "First user rejection test",
        "first-user-rejection-test@example.com",
        "Abc123!?"
      )

      val secondUser = User.CreationData(
        "Second user rejection test",
        "second-user-rejection-test@example.com",
        "Abc123!?"
      )

      given Option[User] = none[User]

      for
        _ <- Users.create(firstUser).value
        _ <- Users
          .create(secondUser)
          .assertEquals(
            Left(Error(Status.Forbidden, __.ErrorUserRegisterForbidden))
          )
      yield ()
    }
  }

  test("should register an nth user if a customer requests it") {
    cleanUsersCollection.use { _ =>
      val firstUserData = User.CreationData(
        "First user acceptance test",
        "first-user-acceptance-test@example.com",
        "Abc123!?"
      )

      val secondUserData = User.CreationData(
        "Second user acceptance test",
        "second-user-acceptance-test@example.com",
        "Abc123!?"
      )

      for
        firstUser <- {
          given Option[User] = none[User]
          Users.create(firstUserData).orFail
        }
        secondUser <- {
          given Option[User] = Some(firstUser)

          Users
            .create(secondUserData)
            .orFail
            .map(_.email.toString)
            .assertEquals(secondUserData.email)
        }
      yield ()
    }
  }

  test(
    "should reject registration if a user with the same email already exists"
  ) {
    cleanUsersCollection.use { _ =>
      val firstUserData = User.CreationData(
        "First user same email test",
        "first-user-same-email-test@example.com",
        "Abc123!?"
      )

      val secondUserData = User.CreationData(
        "Second user same email test",
        "first-user-same-email-test@example.com",
        "Abc123!?"
      )

      for
        firstUser <- {
          given Option[User] = none[User]
          Users.create(firstUserData).orFail
        }
        _ <- {
          given Option[User] = Some(firstUser)
          Users
            .create(secondUserData)
            .assertEquals(Left(Error(Status.Conflict, __.ErrorUserConflict)))
        }
      yield ()
    }
  }

  test("should update a user") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Update test",
        "update-test@example.com",
        "Abc123!?"
      )

      val update = User.UpdateData(
        Some("Updated name"),
        none[String],
        Some("Upd4t3dP4ssw0rd!")
      )

      for
        original <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        _ <- IO.delay(Thread.sleep(500))
        updated <- {
          given User = original
          Users.update(update).orFail
        }
        _ = assertEquals(updated.name.toString, update.name.get)
        _ = assertEquals(updated.email.toString, userData.email)
        _ = assert(updated.password != update.password.get)
        _ = assert(
          update.password.get.isBcryptedBounded(
            updated.password.toString
          )
        )
      yield ()
    }
  }

  test("should ignore empty updated fields") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Update test ignore if empty",
        "update-test-ignore-if-empty@example.com",
        "Abc123!?"
      )

      val update = User.UpdateData(
        none[String],
        none[String],
        none[String]
      )

      for
        original <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        updated <- {
          given User = original
          Users.update(update).orFail
        }
        _ = assertEquals(updated.name.toString, userData.name)
        _ = assertEquals(updated.email.toString, userData.email)
        _ = assertEquals(updated.password, original.password)
      yield ()
    }
  }

  test("should reject the update if another user has the new email address") {
    cleanUsersCollection.use { _ =>
      val firstUserData = User.CreationData(
        "First user update test",
        "first-user-update-test@example.com",
        "Abc123!?"
      )

      val secondUserData = User.CreationData(
        "Second user update test",
        "second-user-update-test@example.com",
        "Abc123!?"
      )

      for
        firstUser <- {
          given Option[User] = none[User]
          Users.create(firstUserData).orFail
        }
        secondUser <- {
          given Option[User] = Some(firstUser)
          Users.create(secondUserData).orFail
        }
        _ <- {
          given User = secondUser
          Users
            .update(
              User.UpdateData(
                none[String],
                Some(firstUserData.email),
                none[String]
              )
            )
            .assertEquals(Left(Error(Status.Conflict, __.ErrorUserConflict)))
        }
      yield ()
    }
  }

  test("should log a user in") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Login test",
        "login-test@example.com",
        "Abc123!?"
      )

      for
        user <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        authTokens <- Users
          .login(User.LoginData(user.email, userData.password))
          .orFail
        _ <- JWT
          .decodeToken(authTokens.accessToken, JWT.UserAccess)
          .orFail
          .map(_.email.toString)
          .assertEquals(userData.email)
      yield ()
    }
  }

  test("should reject the login if the user is not registered") {
    cleanUsersCollection.use { _ =>
      val fakeUser = User
        .fromCreationData(
          User.CreationData(
            "Made up user",
            "made-up-user@example.com",
            "Whatever"
          )
        )
        .getOrElse(fail(""))

      Users
        .login(User.LoginData(fakeUser.email, fakeUser.password.toString))
        .assertEquals(
          Left(Error(Status.BadRequest, __.ErrorInvalidEmailOrPassword))
        )
    }
  }

  test("should reject the login if the user has an invalid email address") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Login invalid email test",
        "login-invalid-email-test@example.com",
        "Abc123!?"
      )

      for
        user <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        _ <- Users
          .login(
            User.LoginData(
              Email.decode("some-other-email@example.com").getOrElse(fail("")),
              userData.password
            )
          )
          .assertEquals(
            Left(Error(Status.BadRequest, __.ErrorInvalidEmailOrPassword))
          )
      yield ()
    }
  }

  test("should reject the login if the user has an invalid password") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Login invalid password test",
        "login-invalid-password-test@example.com",
        "Abc123!?"
      )

      for
        user <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        _ <- Users
          .login(User.LoginData(user.email, "someOtherPassword"))
          .assertEquals(
            Left(Error(Status.BadRequest, __.ErrorInvalidEmailOrPassword))
          )
      yield ()
    }
  }

  test("should refresh a token") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Refresh token test",
        "refresh-token-test@example.com",
        "Abc123!?"
      )

      for
        user <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        authTokens <- Users
          .login(User.LoginData(user.email, userData.password))
          .orFail
        // expiration must be different in order for the tokens to be different
        _ <- IO.delay(Thread.sleep(1000))
        freshTokens <- Users
          .refreshToken(User.RefreshTokenData(authTokens.refreshToken))
          .orFail
        _ = {
          assert(authTokens.accessToken != freshTokens.accessToken)
          assert(authTokens.refreshToken != freshTokens.refreshToken)
        }
      yield ()
    }
  }

  test("should not refresh an access token") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Refresh access token test",
        "refresh-access-token-test@example.com",
        "Abc123!?"
      )

      for
        user <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        authTokens <- Users
          .login(User.LoginData(user.email, userData.password))
          .orFail
        // expiration must be different in order for the tokens to be different
        _ <- IO.delay(Thread.sleep(1000))
        _ <- Users
          .refreshToken(User.RefreshTokenData(authTokens.accessToken))
          .assertEquals(
            Left(Error(Status.Forbidden, __.ErrorInvalidAccessToken))
          )
      yield ()
    }
  }

  test("should delete a user") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Delete user test",
        "delete-user-test@example.com",
        "Abc123!?"
      )

      for
        user <- {
          given Option[User] = none[User]
          Users.create(userData).orFail
        }
        _ <- {
          given User = user
          Users.delete.orFail.map(_.email.toString).assertEquals(userData.email)
        }
        _ <- {
          given User = user
          Users.collection
            .use(_.findOne[User](Filter.eq("_id", user._id)))
            .assertEquals(
              Left(Error(Status.NotFound, __.ErrorDocumentNotFound))
            )
        }
      yield ()
    }
  }
}
