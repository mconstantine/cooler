package it.mconst.cooler.models.user

import cats.effect.IO
import com.github.t3hnar.bcrypt._
import com.mongodb.client.model.{Filters, Updates}
import com.osinka.i18n.Lang
import io.circe.generic.auto._
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.utils.{
  Collection,
  Document,
  Error,
  Timestamps,
  Translations
}
import it.mconst.cooler.utils.given
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.Status
import scala.collection.JavaConverters._
import scala.util.{Success, Failure}

case class UserCreationData(
    name: String,
    email: String,
    password: String
)

case class UserUpdateData(
    name: Option[String],
    email: Option[String],
    password: Option[String]
)

case class User(
    _id: ObjectId,
    name: String,
    email: String,
    password: String,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Document
    with Timestamps

case class Users()(using Lang) {
  val collection = Collection[User]("users")

  def register(
      user: UserCreationData
  )(using customer: Option[User]): IO[Either[Error, User]] =
    for
      firstUserOrCustomer <- customer match
        case Some(_) => IO(None)
        case None =>
          collection
            .use(_.find.first)
            .map(_ match
              case None => None
              case Some(_) =>
                Some(
                  Error(
                    Status.Forbidden,
                    Translations.Key.ErrorUserRegisterForbidden
                  )
                )
            )
      userExists <- firstUserOrCustomer match
        case Some(error) => IO(Some(error))
        case None =>
          collection
            .use(_.find(Filter.eq("email", user.email)).first)
            .map(
              _.map(user =>
                Error(Status.Conflict, Translations.Key.ErrorUserConflict)
              )
            )
      user <- userExists match
        case Some(error) => IO(Left(error))
        case None =>
          for
            hashedPassword <- IO.fromTry(user.password.bcryptSafeBounded)
            user <- collection.create(
              User(
                new ObjectId(),
                user.name,
                user.email,
                hashedPassword,
                BsonDateTime(System.currentTimeMillis()),
                BsonDateTime(System.currentTimeMillis())
              )
            )
          yield user
    yield user

  def findById()(using customer: User): IO[Option[User]] =
    collection.use(_.find(Filter.eq("_id", customer._id)).first)

  def findByEmail()(using customer: User): IO[Option[User]] =
    collection.use(_.find(Filter.eq("email", customer.email)).first)

  def update(
      data: UserUpdateData
  )(using customer: User): IO[Either[Error, User]] =
    for
      password <- data.password match
        case None => IO(None)
        case Some(password) =>
          IO.fromTry(password.bcryptSafeBounded).map(Some(_))
      existingEmailError <- data.email match
        case None => IO(None)
        case Some(email) =>
          collection
            .use(
              _.find(
                Filter.eq("email", email).and(Filter.ne("_id", customer._id))
              ).first
            )
            .flatMap(_ match
              case None => IO(None)
              case Some(_) =>
                IO(
                  Some(
                    Error(Status.Conflict, Translations.Key.ErrorUserConflict)
                  )
                )
            )
      result <- existingEmailError match
        case Some(error) => IO(Left(error))
        case None =>
          val updates = List(
            data.name.map(name => Updates.set("name", name)).toList,
            data.email.map(email => Updates.set("email", email)).toList,
            password.map(password => Updates.set("password", password)).toList
          ).flatten

          collection.update(customer, Updates.combine(updates.asJava))
    yield result

  def login(
      email: String,
      password: String
  ): IO[Either[Error, JWT.AuthTokens]] =
    collection
      .use(_.find(Filter.eq("email", email)).first)
      .map { user =>
        for
          userWithValidatedEmail <- user match
            case None =>
              Left(
                Error(
                  Status.NotFound,
                  Translations.Key.ErrorInvalidEmailOrPassword
                )
              )
            case Some(user) => Right(user)
          userWithValidatedPassword <- password.isBcryptedSafeBounded(
            userWithValidatedEmail.password
          ) match
            case Success(_) => Right(userWithValidatedEmail)
            case Failure(_) =>
              Left(
                Error(
                  Status.Unauthorized,
                  Translations.Key.ErrorInvalidEmailOrPassword
                )
              )
          authTokens <- Right(JWT.generateAuthTokens(userWithValidatedPassword))
        yield authTokens
      }

  def refreshToken(token: String): IO[Either[Error, JWT.AuthTokens]] =
    for
      userResult <- JWT.decodeToken(token, JWT.UserRefresh)
      authTokens <- IO(
        userResult.flatMap(user => Right(JWT.generateAuthTokens(user)))
      )
    yield authTokens

  def delete()(using customer: User): IO[Either[Error, User]] =
    collection.delete(customer)
}
