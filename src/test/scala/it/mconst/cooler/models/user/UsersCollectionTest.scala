package it.mconst.cooler.models.user

import org.scalatest._
import matchers._
import flatspec._

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import com.github.t3hnar.bcrypt._
import com.osinka.i18n.Lang
import it.mconst.cooler.utils.{__, Error}
import mongo4cats.bson.ObjectId
import org.bson.BsonDateTime
import org.http4s.Status

class UsersCollectionTest extends AnyFlatSpec with should.Matchers {
  given Lang = Lang.Default

  it should "register a user" in {
    val userData = User.CreationData(
      "Registration test",
      "registration-test@example.com",
      "Abc123!?"
    )

    given Option[User] = None

    val registration =
      for
        user <- Users.register(userData)
        _ <- Users.collection.drop
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

    val result =
      for
        _ <- Users.register(firstUser)
        result <- Users.register(secondUser)
        _ <- Users.collection.drop
      yield result

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.Forbidden, __.ErrorUserRegisterForbidden)
    )
  }

  it should "register an nth user if a customer requests it" in {
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

    val result =
      for
        firstUserResult <- {
          given Option[User] = None
          Users.register(firstUserData)
        }
        secondUserResult <- firstUserResult match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given Option[User] = Some(user)
            Users.register(secondUserData)
          }
        _ <- Users.collection.drop
      yield secondUserResult

    val secondUser = result.unsafeRunSync()

    secondUser match
      case Left(error) => fail(error.message.toString)
      case Right(user) => user.email shouldBe secondUserData.email
  }

  it should "reject registration if a user with the same email already exists" in {
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

    val result =
      for
        firstUserResult <- {
          given Option[User] = None
          Users.register(firstUserData)
        }
        secondUserResult <- firstUserResult match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given Option[User] = Some(user)
            Users.register(secondUserData)
          }
        _ <- Users.collection.drop
      yield secondUserResult

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.Conflict, __.ErrorUserConflict)
    )
  }

  it should "find a user by id" in {
    val userData = User.CreationData(
      "Fetching by _id test",
      "fetching-by-id-test@example.com",
      "Abc123!?"
    )

    val fetching =
      for
        user <- {
          given Option[User] = None
          Users
            .register(userData)
            .flatMap(_ match
              case Left(error) => fail(error.message.toString)
              case Right(user) => {
                given User = user
                Users.findById()
              }
            )
        }
        _ <- Users.collection.drop
      yield user

    val user = fetching.unsafeRunSync()
    user.map(_.email) shouldBe Some(userData.email)
  }

  it should "find a user by email" in {
    val userData = User.CreationData(
      "Fetching by email test",
      "fetching-by-email-test@example.com",
      "Abc123!?"
    )

    val fetching =
      for
        user <- {
          given Option[User] = None
          Users
            .register(userData)
            .flatMap(_ match
              case Left(_) => IO(None)
              case Right(user) => {
                given User = user
                Users.findByEmail()
              }
            )
        }
        _ <- Users.collection.drop
      yield user

    val user = fetching.unsafeRunSync()
    user.map(_.email) shouldBe Some(userData.email)
  }

  it should "update a user" in {
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

    val operation =
      for
        original <- {
          given Option[User] = None
          Users.register(userData)
        }
        updated <- original match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given User = user
            Users.update(update)
          }
        _ <- Users.collection.drop
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

    val result =
      for
        firstUserResult <- {
          given Option[User] = None
          Users.register(firstUserData)
        }
        secondUserResult <- firstUserResult match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given Option[User] = Some(user)
            Users.register(secondUserData)
          }
        update <- secondUserResult match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given User = user
            Users.update(
              User.UpdateData(
                None,
                Some(firstUserData.email),
                None
              )
            )
          }
        _ <- Users.collection.drop
      yield update

    val update = result.unsafeRunSync()

    update match
      case Left(error) =>
        error shouldEqual Error(Status.Conflict, __.ErrorUserConflict)
      case Right(user) =>
        fail("A user was updated with an email that already exists")
  }

  it should "log a user in" in {
    val userData = User.CreationData(
      "Login test",
      "login-test@example.com",
      "Abc123!?"
    )

    val loggedInUserResult =
      for
        registration <- {
          given Option[User] = None
          Users.register(userData)
        }
        authTokens <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            Users.login(User.LoginData(user.email, userData.password))
        user <- authTokens match
          case Left(error) => IO(Left(error))
          case Right(authTokens) =>
            JWT.decodeToken(authTokens.accessToken, JWT.UserAccess)
        _ <- Users.collection.drop
      yield user

    loggedInUserResult.unsafeRunSync() match
      case Left(error) => fail(error.message.toString)
      case Right(user) => user.email shouldBe userData.email
  }

  it should "reject the login if the user is not registered" in {
    val fakeUser = User
      .fromCreationData(
        User.CreationData(
          "Made up user",
          "madeup-user@example.com",
          "Whatever"
        )
      )
      .getOrElse(fail(""))

    val result =
      Users
        .login(User.LoginData(fakeUser.email, fakeUser.password.toString))
        .unsafeRunSync()

    result shouldEqual Left(
      Error(Status.BadRequest, __.ErrorInvalidEmailOrPassword)
    )
  }

  it should "reject the login if the user has an invalid email address" in {
    val userData = User.CreationData(
      "Login invalid email test",
      "login-invalid-email-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        registration <- {
          given Option[User] = None
          Users.register(userData)
        }
        login <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            Users.login(
              User.LoginData(
                Email
                  .fromString("some-other-email@example.com")
                  .getOrElse(fail("")),
                userData.password
              )
            )
        _ <- Users.collection.drop
      yield login

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.BadRequest, __.ErrorInvalidEmailOrPassword)
    )
  }

  it should "reject the login if the user has an invalid password" in {
    val userData = User.CreationData(
      "Login invalid password test",
      "login-invalid-password-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        registration <- {
          given Option[User] = None
          Users.register(userData)
        }
        login <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            Users.login(User.LoginData(user.email, "someOtherPassword"))
        _ <- Users.collection.drop
      yield login

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.BadRequest, __.ErrorInvalidEmailOrPassword)
    )
  }

  it should "refresh a token" in {
    val userData = User.CreationData(
      "Refresh token test",
      "refresh-token-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        registration <- {
          given Option[User] = None
          Users.register(userData)
        }
        authTokens <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            Users.login(User.LoginData(user.email, userData.password))
        // expiration must be different in order for the tokens to be different
        _ <- IO.delay(Thread.sleep(1000))
        freshTokens <- authTokens match
          case Left(error)       => IO(Left(error))
          case Right(authTokens) => Users.refreshToken(authTokens.refreshToken)
        _ <- Users.collection.drop
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
    val userData = User.CreationData(
      "Refresh access token test",
      "refresh-access-token-test@example.com",
      "Abc123!?"
    )

    val result =
      for
        registration <- {
          given Option[User] = None
          Users.register(userData)
        }
        authTokens <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) =>
            Users.login(User.LoginData(user.email, userData.password))
        // expiration must be different in order for the tokens to be different
        _ <- IO.delay(Thread.sleep(1000))
        freshTokens <- authTokens match
          case Left(error)       => IO(Left(error))
          case Right(authTokens) => Users.refreshToken(authTokens.accessToken)
        _ <- Users.collection.drop
      yield freshTokens

    result.unsafeRunSync() shouldEqual Left(
      Error(Status.Forbidden, __.ErrorInvalidAccessToken)
    )
  }

  it should "delete a user" in {
    val userData = User.CreationData(
      "Delete user test",
      "delete-user-test@example.com",
      "Abc123!?"
    )

    val operation: IO[(Either[Error, User], Option[User])] =
      for
        registration <- {
          given Option[User] = None
          Users.register(userData)
        }
        deletion <- registration match
          case Left(error) => IO(Left(error))
          case Right(user) => {
            given User = user
            Users.delete()
          }
        userAfterDeletion <- deletion match
          case Left(error) =>
            IO.raiseError(
              new RuntimeException("Unable to fetch users after deletion")
            )
          case Right(user) => {
            given User = user
            Users.findById()
          }
        _ <- Users.collection.drop
      yield (deletion, userAfterDeletion)

    val (deletionResult, userAfterDeletionResult) = operation.unsafeRunSync()

    (deletionResult, userAfterDeletionResult) match
      case (Right(user), None) => user.email shouldBe userData.email
      case _                   => fail("Unable to delete user")
  }
}
