package it.mconst.cooler.models.user

import cats.effect.IO
import com.github.t3hnar.bcrypt._
import com.mongodb.client.model.{Filters, Updates}
import com.osinka.i18n.Lang
import io.circe.{Decoder, DecodingFailure, Encoder}
import io.circe.generic.auto._
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.utils.{__, Collection, Document, Error, Timestamps}
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result._
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.operations.Filter
import munit.Assertions
import org.bson.BsonDateTime
import org.http4s.{EntityDecoder, EntityEncoder}
import org.http4s.circe._
import org.http4s.dsl.io._
import scala.collection.JavaConverters._
import scala.util.{Success, Failure}

opaque type NonEmptyString = String

object NonEmptyString {
  def fromString(s: String): Option[NonEmptyString] =
    Option.unless(s.isEmpty)(s)

  def unsafeFromString(s: String)(using a: Assertions): NonEmptyString =
    fromString(s).getOrElse(a.fail(s"Invalid NonEmptyString: $s"))

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

  def unsafeFromString(s: String)(using a: Assertions): Email =
    fromString(s).getOrElse(a.fail(s"Invalid Email: $s"))

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

  def unsafeFromString(s: String)(using a: Assertions): Password =
    fromString(s).getOrElse(a.fail(s"Invalid Password: $s"))

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

given EntityEncoder[IO, User] = jsonEncoderOf[IO, User]

object User {
  case class CreationData(
      name: String,
      email: String,
      password: String
  )
  given EntityDecoder[IO, CreationData] = jsonOf[IO, CreationData]

  case class UpdateData(
      name: Option[String],
      email: Option[String],
      password: Option[String]
  )
  given EntityDecoder[IO, UpdateData] = jsonOf[IO, UpdateData]

  case class RefreshTokenData(refreshToken: String)
  given EntityDecoder[IO, RefreshTokenData] = jsonOf[IO, RefreshTokenData]

  case class LoginData(email: Email, password: String)
  given EntityDecoder[IO, LoginData] = jsonOf[IO, LoginData]

  def fromCreationData(
      data: CreationData
  )(using Lang): Result[User] =
    for
      name <- NonEmptyString
        .fromString(data.name)
        .toRight(Error(BadRequest, __.ErrorUserRegisterEmptyName))
      email <- Email
        .fromString(data.email)
        .toRight(Error(BadRequest, __.ErrorUserRegisterInvalidEmailFormat))
      password <-
        Password
          .fromString(data.password)
          .toRight(Error(BadRequest, __.ErrorUserRegisterInvalidPasswordFormat))
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
  )(using customer: Option[User])(using Lang): IO[Result[User]] =
    for
      firstUserOrCustomerError <- customer.swapLift(
        collection
          .use(_.count)
          .map(n =>
            Option.when(n > 0)(Error(Forbidden, __.ErrorUserRegisterForbidden))
          )
      )
      userExistsError <- firstUserOrCustomerError.liftNone(
        collection
          .use(_.find(Filter.eq("email", user.email)).first)
          .map(_.map(user => Error(Conflict, __.ErrorUserConflict)))
      )
      user <- userExistsError.toLeftLift(
        User.fromCreationData(user).lift(collection.create(_))
      )
    yield user

  def findById()(using customer: User): IO[Option[User]] =
    collection.use(_.find(Filter.eq("_id", customer._id)).first)

  def findByEmail()(using customer: User): IO[Option[User]] =
    collection.use(_.find(Filter.eq("email", customer.email)).first)

  def update(
      data: User.UpdateData
  )(using customer: User)(using Lang): IO[Result[User]] =
    for
      password <- data.password.lift(p =>
        IO.fromTry(p.bcryptSafeBounded).map(Some(_))
      )
      existingEmailError <- data.email.lift(e =>
        collection
          .use(
            _.find(
              Filter.eq("email", e).and(Filter.ne("_id", customer._id))
            ).first
          )
          .map(_.map(_ => Error(Conflict, __.ErrorUserConflict)))
      )
      result <- existingEmailError.toLeftLift {
        val updates = List(
          data.name.map(name => Updates.set("name", name)).toList,
          data.email.map(email => Updates.set("email", email)).toList,
          password.map(password => Updates.set("password", password)).toList
        ).flatten

        collection.update(customer, Updates.combine(updates.asJava))
      }
    yield result

  def login(
      data: User.LoginData
  )(using Lang): IO[Result[JWT.AuthTokens]] =
    for
      user <- collection
        .use(_.find(Filter.eq("email", data.email)).first)
        .map(_.toRight(Error(BadRequest, __.ErrorInvalidEmailOrPassword)))
      userWithRightPassword = user.flatMap(user =>
        data.password
          .isBcryptedSafeBounded(user.password.toString)
          .toEither
          .mapLeft(Error(BadRequest, __.ErrorInvalidEmailOrPassword))
          .flatMap(
            Either
              .cond(_, user, Error(BadRequest, __.ErrorInvalidEmailOrPassword))
          )
      )
      authTokens = userWithRightPassword.map(JWT.generateAuthTokens(_))
    yield authTokens

  def refreshToken(
      data: User.RefreshTokenData
  )(using Lang): IO[Result[JWT.AuthTokens]] =
    for
      userResult <- JWT.decodeToken(data.refreshToken, JWT.UserRefresh)
      authTokens = userResult.map(JWT.generateAuthTokens(_))
    yield authTokens

  def delete(using customer: User)(using Lang): IO[Result[User]] =
    collection.delete(customer)
}
