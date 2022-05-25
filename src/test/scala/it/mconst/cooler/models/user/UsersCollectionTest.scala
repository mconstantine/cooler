package it.mconst.cooler.models.user

import munit.{Assertions, CatsEffectSuite}
import it.mconst.cooler.utils.TestUtils._

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.effect.unsafe.implicits.global
import cats.syntax._
import com.github.t3hnar.bcrypt._
import com.osinka.i18n.Lang
import it.mconst.cooler.models.Email
import it.mconst.cooler.utils.{__, Error}
import mongo4cats.bson.ObjectId
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.Status

class UsersCollectionTest extends CatsEffectSuite {
  given Lang = Lang.Default
  given Assertions = this

  val cleanUsersCollection =
    Resource.make(IO.unit)(_ =>
      Users.collection.use(c => c.deleteMany(Filter.empty).void)
    )

  test("should register a user") {
    cleanUsersCollection.use { _ =>
      val userData = User.CreationData(
        "Registration test",
        "registration-test@example.com",
        "Abc123!?"
      )

      given Option[User] = None

      for
        user <- Users.register(userData).orFail
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

      given Option[User] = None

      for
        _ <- Users.register(firstUser)
        result <- Users
          .register(secondUser)
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
          given Option[User] = None
          Users.register(firstUserData).orFail
        }
        secondUser <- {
          given Option[User] = Some(firstUser)

          Users
            .register(secondUserData)
            .orFail
            .map(_.email)
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
          given Option[User] = None
          Users.register(firstUserData).orFail
        }
        secondUser <- {
          given Option[User] = Some(firstUser)
          Users
            .register(secondUserData)
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
        None,
        Some("Upd4t3dP4ssw0rd!")
      )

      for
        original <- {
          given Option[User] = None
          Users.register(userData).orFail
        }
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
          given Option[User] = None
          Users.register(firstUserData).orFail
        }
        secondUser <- {
          given Option[User] = Some(firstUser)
          Users.register(secondUserData).orFail
        }
        update <- {
          given User = secondUser
          Users
            .update(User.UpdateData(None, Some(firstUserData.email), None))
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
          given Option[User] = None
          Users.register(userData).orFail
        }
        authTokens <- Users
          .login(User.LoginData(user.email, userData.password))
          .orFail
        _ <- JWT
          .decodeToken(authTokens.accessToken, JWT.UserAccess)
          .orFail
          .map(_.email)
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
          given Option[User] = None
          Users.register(userData).orFail
        }
        _ <- Users
          .login(
            User.LoginData(
              Email.unsafeDecode("some-other-email@example.com"),
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
          given Option[User] = None
          Users.register(userData).orFail
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
          given Option[User] = None
          Users.register(userData).orFail
        }
        authTokens <- Users
          .login(User.LoginData(user.email, userData.password))
          .orFail
        // expiration must be different in order for the tokens to be different
        _ <- IO.delay(Thread.sleep(500))
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
          given Option[User] = None
          Users.register(userData).orFail
        }
        authTokens <- Users
          .login(User.LoginData(user.email, userData.password))
          .orFail
        // expiration must be different in order for the tokens to be different
        _ <- IO.delay(Thread.sleep(500))
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
          given Option[User] = None
          Users.register(userData).orFail
        }
        _ <- {
          given User = user
          Users.delete.orFail.map(_.email).assertEquals(userData.email)
        }
        _ <- {
          given User = user
          Users.collection
            .use(_.find(Filter.eq("_id", user._id)).first)
            .assertEquals(None)
        }
      yield ()
    }
  }
}
