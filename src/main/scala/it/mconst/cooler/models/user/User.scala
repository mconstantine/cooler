package it.mconst.cooler.models.user

import cats.effect.IO
import com.github.t3hnar.bcrypt._
import com.mongodb.client.model.{Filters, Updates}
import com.osinka.i18n.Lang
import io.circe.{Decoder, DecodingFailure, Encoder}
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

opaque type NonEmptyString = String

object NonEmptyString {
  def fromString(s: String): Option[NonEmptyString] =
    Option.unless(s.isEmpty)(s)

  given Encoder[NonEmptyString] = Encoder.encodeString

  given Decoder[NonEmptyString] =
    Decoder.decodeString.flatMap { s =>
      Decoder.instance(_ =>
        fromString(s).toRight(DecodingFailure("NonEmptyString", List.empty))
      )
    }
}

given CanEqual[NonEmptyString, String] = CanEqual.derived

opaque type Email = String

object Email {
  private def pattern =
    """^[a-zA-Z0-9\.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$""".r

  def fromString(s: String): Option[Email] = NonEmptyString
    .fromString(s)
    .flatMap(Option.when(pattern.unapplySeq(s).isDefined))

  given Encoder[Email] = Encoder.encodeString

  given Decoder[Email] =
    Decoder.decodeString.flatMap { s =>
      Decoder.instance(_ =>
        fromString(s).toRight(DecodingFailure("Email", List.empty))
      )
    }
}

given CanEqual[Email, String] = CanEqual.derived

opaque type Password = String

object Password {
  def fromString(s: String): Option[Password] =
    NonEmptyString
      .fromString(s)
      .flatMap(_.toString.bcryptSafeBounded.toOption)

  given Encoder[Password] = Encoder.encodeString
  given Decoder[Password] = Decoder.decodeString
}

given CanEqual[Password, String] = CanEqual.derived

case class User(
    _id: ObjectId,
    name: NonEmptyString,
    email: Email,
    password: Password,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Document
    with Timestamps

object User {
  case class CreationData(
      name: String,
      email: String,
      password: String
  )

  case class UpdateData(
      name: Option[String],
      email: Option[String],
      password: Option[String]
  )

  case class LoginData(email: Email, password: String)

  def fromCreationData(
      data: CreationData
  )(using Lang): Either[Error, User] =
    for
      name <- NonEmptyString
        .fromString(data.name)
        .toRight(
          Error(
            Status.BadRequest,
            Translations.Key.ErrorUserRegisterEmptyName
          )
        )
      email <- Email
        .fromString(data.email)
        .toRight(
          Error(
            Status.BadRequest,
            Translations.Key.ErrorUserRegisterInvalidEmailFormat
          )
        )
      password <-
        Password
          .fromString(data.password)
          .toRight(
            Error(
              Status.BadRequest,
              Translations.Key.ErrorUserRegisterInvalidPasswordFormat
            )
          )
      user <- Right(
        User(
          _id = ObjectId(),
          name = name,
          email = email,
          password = password,
          createdAt = BsonDateTime(System.currentTimeMillis()),
          updatedAt = BsonDateTime(System.currentTimeMillis())
        )
      )
    yield user
}

object Users {
  val collection = Collection[User]("users")

  def register(
      user: User.CreationData
  )(using customer: Option[User])(using Lang): IO[Either[Error, User]] =
    for
      firstUserOrCustomer <- customer match
        case Some(_) => IO(None)
        case None =>
          collection
            .use(_.find.first)
            .map(
              _.map(_ =>
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
            userData <- IO(User.fromCreationData(user))
            user <- userData match
              case Right(userData) => collection.create(userData)
              case Left(error)     => IO(Left(error))
          yield user
    yield user

  def findById()(using customer: User): IO[Option[User]] =
    collection.use(_.find(Filter.eq("_id", customer._id)).first)

  def findByEmail()(using customer: User): IO[Option[User]] =
    collection.use(_.find(Filter.eq("email", customer.email)).first)

  def update(
      data: User.UpdateData
  )(using customer: User)(using Lang): IO[Either[Error, User]] =
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
            .map(
              _.map(_ =>
                Error(Status.Conflict, Translations.Key.ErrorUserConflict)
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
      data: User.LoginData
  )(using Lang): IO[Either[Error, JWT.AuthTokens]] =
    for
      user <- collection
        .use(_.find(Filter.eq("email", data.email)).first)
        .map(
          _.toRight(
            Error(
              Status.BadRequest,
              Translations.Key.ErrorInvalidEmailOrPassword
            )
          )
        )
      userWithRightPassword <- IO(user.flatMap { user =>
        data.password
          .isBcryptedSafeBounded(user.password.toString)
          .toEither match
          case Left(_) =>
            Left(
              Error(
                Status.BadRequest,
                Translations.Key.ErrorInvalidEmailOrPassword
              )
            )
          case Right(isSamePassword) =>
            Either.cond(
              isSamePassword,
              user,
              Error(
                Status.BadRequest,
                Translations.Key.ErrorInvalidEmailOrPassword
              )
            )
      })
      authTokens <- IO(
        userWithRightPassword.map(JWT.generateAuthTokens(_))
      )
    yield authTokens

  def refreshToken(
      token: String
  )(using Lang): IO[Either[Error, JWT.AuthTokens]] =
    for
      userResult <- JWT.decodeToken(token, JWT.UserRefresh)
      authTokens <- IO(userResult.map(JWT.generateAuthTokens(_)))
    yield authTokens

  def delete()(using customer: User)(using Lang): IO[Either[Error, User]] =
    collection.delete(customer)
}
