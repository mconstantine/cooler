package it.mconst.cooler.models.user

import org.scalatest._
import matchers._
import flatspec._

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import com.github.t3hnar.bcrypt._
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.utils.{Error, Translations}
import mongo4cats.bson.ObjectId
import org.bson.BsonDateTime
import org.http4s.Status

class UsersCollectionTest extends AnyFlatSpec with should.Matchers {
  given Lang = Lang.Default
  val users = Users()

  it should "register a user" in {
    val userData = UserCreationData(
      "Registration test",
      "registration-test@example.com",
      "Abc123!?"
    )

    given Option[User] = None

    val registration =
      for
        user <- users.register(userData)
        _ <- users.collection.drop
      yield user

    val user = registration.unsafeRunSync()

    user match
      case Left(error) => fail(error.message.toString)
      case Right(user) =>
        user.email shouldBe userData.email
        user.password shouldNot be(userData.password)

        userData.password.isBcryptedBounded(
          user.password.toString
        ) shouldBe true
  }

  it should "reject registration if there is a user already registered and no customer" in {
    val firstUser = UserCreationData(
      "First user rejection test",
      "first-user-rejection-test@example.com",
      "Abc123!?"
    )

    val secondUser = UserCreationData(
      "Second user rejection test",
      "second-user-rejection-test@example.com",
      "Abc123!?"
    )

    given Option[User] = None

    val result =
      for
        _ <- users.register(firstUser)
        result <- users.register(secondUser)
        _ <- users.collection.drop
      yield result

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.Forbidden, Translations.Key.ErrorUserRegisterForbidden)
    )
  }

  it should "register an nth user if a customer requests it" in {
    val firstUserData = UserCreationData(
      "First user acceptance test",
      "first-user-acceptance-test@example.com",
      "Abc123!?"
    )

    val secondUserData = UserCreationData(
      "Second user acceptance test",
      "second-user-acceptance-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        firstUserResult <- {
          given Option[User] = None
          users.register(firstUserData)
        }
        secondUserResult <- firstUserResult match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given Option[User] = Some(user)
            users.register(secondUserData)
          }
        _ <- users.collection.drop
      yield secondUserResult

    val secondUser = result.unsafeRunSync()

    secondUser match
      case Left(error) => fail(error.message.toString)
      case Right(user) => user.email shouldBe secondUserData.email
  }

  it should "reject registration if a user with the same email already exists" in {
    val firstUserData = UserCreationData(
      "First user same email test",
      "first-user-same-email-test@example.com",
      "Abc123!?"
    )

    val secondUserData = UserCreationData(
      "Second user same email test",
      "first-user-same-email-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        firstUserResult <- {
          given Option[User] = None
          users.register(firstUserData)
        }
        secondUserResult <- firstUserResult match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given Option[User] = Some(user)
            users.register(secondUserData)
          }
        _ <- users.collection.drop
      yield secondUserResult

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.Conflict, Translations.Key.ErrorUserConflict)
    )
  }

  it should "find a user by id" in {
    val userData = UserCreationData(
      "Fetching by _id test",
      "fetching-by-id-test@example.com",
      "Abc123!?"
    )

    val fetching =
      for
        user <- {
          given Option[User] = None
          users
            .register(userData)
            .flatMap(_ match
              case Left(error) => fail(error.message.toString)
              case Right(user) => {
                given User = user
                users.findById()
              }
            )
        }
        _ <- users.collection.drop
      yield user

    val user = fetching.unsafeRunSync()
    user.map(_.email) shouldBe Some(userData.email)
  }

  it should "find a user by email" in {
    val userData = UserCreationData(
      "Fetching by email test",
      "fetching-by-email-test@example.com",
      "Abc123!?"
    )

    val fetching =
      for
        user <- {
          given Option[User] = None
          users
            .register(userData)
            .flatMap(_ match
              case Left(_) => IO(None)
              case Right(user) => {
                given User = user
                users.findByEmail()
              }
            )
        }
        _ <- users.collection.drop
      yield user

    val user = fetching.unsafeRunSync()
    user.map(_.email) shouldBe Some(userData.email)
  }

  it should "update a user" in {
    val userData = UserCreationData(
      "Update test",
      "update-test@example.com",
      "Abc123!?"
    )

    val update = UserUpdateData(
      Some("Updated name"),
      None,
      Some("Upd4t3dP4ssw0rd!")
    )

    val operation =
      for
        original <- {
          given Option[User] = None
          users.register(userData)
        }
        updated <- original match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given User = user
            users.update(update)
          }
        _ <- users.collection.drop
      yield (original, updated)

    val (original, updated) = operation.unsafeRunSync()

    (original, updated) match
      case (Right(original), Right(updated)) => {
        updated.name.toString shouldBe update.name.get
        updated.email shouldBe userData.email
        updated.password shouldNot be(update.password.get)

        update.password.get.isBcryptedBounded(
          updated.password.toString
        ) shouldBe true
      }
      case _ => fail("Unable to execute update")
  }

  it should "reject the update if another user has the new email address" in {
    val firstUserData = UserCreationData(
      "First user update test",
      "first-user-update-test@example.com",
      "Abc123!?"
    )

    val secondUserData = UserCreationData(
      "Second user update test",
      "second-user-update-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        firstUserResult <- {
          given Option[User] = None
          users.register(firstUserData)
        }
        secondUserResult <- firstUserResult match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given Option[User] = Some(user)
            users.register(secondUserData)
          }
        update <- secondUserResult match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given User = user
            users.update(
              UserUpdateData(
                None,
                Some(firstUserData.email),
                None
              )
            )
          }
        _ <- users.collection.drop
      yield update

    val update = result.unsafeRunSync()

    update match
      case Left(error) =>
        error shouldEqual Error(
          Status.Conflict,
          Translations.Key.ErrorUserConflict
        )
      case Right(user) =>
        fail("A user was updated with an email that already exists")
  }

  it should "log a user in" in {
    val userData = UserCreationData(
      "Login test",
      "login-test@example.com",
      "Abc123!?"
    )

    val loggedInUserResult =
      for
        registration <- {
          given Option[User] = None
          users.register(userData)
        }
        authTokens <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) => users.login(user.email, userData.password)
        user <- authTokens match
          case Left(error) => IO(Left(error))
          case Right(authTokens) =>
            JWT.decodeToken(authTokens.accessToken, JWT.UserAccess)
        _ <- users.collection.drop
      yield user

    loggedInUserResult.unsafeRunSync() match
      case Left(error) => fail(error.message.toString)
      case Right(user) => user.email shouldBe userData.email
  }

  it should "reject the login if the user is not registered" in {
    val fakeUser = User
      .fromCreationData(
        UserCreationData(
          "Made up user",
          "madeup-user@example.com",
          "Whatever"
        )
      )
      .getOrElse(fail(""))

    val result =
      users.login(fakeUser.email, fakeUser.password.toString).unsafeRunSync()

    result shouldEqual Left(
      Error(Status.BadRequest, Translations.Key.ErrorInvalidEmailOrPassword)
    )
  }

  it should "reject the login if the user has an invalid email address" in {
    val userData = UserCreationData(
      "Login invalid email test",
      "login-invalid-email-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        registration <- {
          given Option[User] = None
          users.register(userData)
        }
        login <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            users.login(
              Email
                .fromString("some-other-email@example.com")
                .getOrElse(fail("")),
              userData.password
            )
        _ <- users.collection.drop
      yield login

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.BadRequest, Translations.Key.ErrorInvalidEmailOrPassword)
    )
  }

  it should "reject the login if the user has an invalid password" in {
    val userData = UserCreationData(
      "Login invalid password test",
      "login-invalid-password-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        registration <- {
          given Option[User] = None
          users.register(userData)
        }
        login <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            users.login(user.email, "someOtherPassword")
        _ <- users.collection.drop
      yield login

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.BadRequest, Translations.Key.ErrorInvalidEmailOrPassword)
    )
  }

  it should "refresh a token" in {
    val userData = UserCreationData(
      "Refresh token test",
      "refresh-token-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        registration <- {
          given Option[User] = None
          users.register(userData)
        }
        authTokens <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) => users.login(user.email, userData.password)
        // expiration must be different in order for the tokens to be different
        _ <- IO.delay(Thread.sleep(1000))
        freshTokens <- authTokens match
          case Left(error)       => IO(Left(error))
          case Right(authTokens) => users.refreshToken(authTokens.refreshToken)
        _ <- users.collection.drop
      yield (authTokens, freshTokens)

    val (authTokens, freshTokens) = result.unsafeRunSync()

    (authTokens, freshTokens) match
      case (Right(authTokens), Right(freshTokens)) => {
        authTokens.accessToken shouldNot be(freshTokens.accessToken)
        authTokens.refreshToken shouldNot be(freshTokens.refreshToken)
      }
      case _ => fail(s"Unable to refresh tokens")
  }

  it should "not refresh an access token" in {
    val userData = UserCreationData(
      "Refresh access token test",
      "refresh-access-token-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        registration <- {
          given Option[User] = None
          users.register(userData)
        }
        authTokens <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) => users.login(user.email, userData.password)
        // expiration must be different in order for the tokens to be different
        _ <- IO.delay(Thread.sleep(1000))
        freshTokens <- authTokens match
          case Left(error)       => IO(Left(error))
          case Right(authTokens) => users.refreshToken(authTokens.accessToken)
        _ <- users.collection.drop
      yield freshTokens

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.Forbidden, Translations.Key.ErrorInvalidAccessToken)
    )
  }

  it should "delete a user" in {
    val userData = UserCreationData(
      "Delete user test",
      "delete-user-test@example.com",
      "Abc123!?"
    )

    val operation: IO[(Either[Error, User], Option[User])] =
      for
        registration <- {
          given Option[User] = None
          users.register(userData)
        }
        deletion <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given User = user
            users.delete()
          }
        userAfterDeletion <- deletion match
          case Left(error) =>
            IO.raiseError(
              new RuntimeException("Unable to fetch users after deletion")
            )
          case Right(user) => {
            given User = user
            users.findById()
          }
        _ <- users.collection.drop
      yield (deletion, userAfterDeletion)

    val (deletionResult, userAfterDeletionResult) = operation.unsafeRunSync()

    (deletionResult, userAfterDeletionResult) match
      case (Right(user), None) => user.email shouldBe userData.email
      case _                   => fail("Unable to delete user")
  }
}
