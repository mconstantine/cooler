package it.mconst.cooler.models.user

import cats.data.NonEmptyList
import cats.data.Validated
import cats.effect.IO
import cats.syntax.apply.*
import com.github.t3hnar.bcrypt.*
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Updates
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.*
import it.mconst.cooler.models.Email
import it.mconst.cooler.models.NonEmptyString
import it.mconst.cooler.models.toResult
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.models.Validation
import it.mconst.cooler.models.ValidationError
import it.mconst.cooler.models.Validator
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.Document
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result.*
import it.mconst.cooler.utils.Timestamps
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import munit.Assertions
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import scala.collection.JavaConverters.*
import scala.util.Failure
import scala.util.Success

opaque type Password = String

object Password extends Validator[String, Password] {
  override def name = "Password"

  // FIXME: this could be called multiple times on a password that is already been encrypted.
  // On a password that starts with "$2a$" this will save the plain password and mess everything
  // up though. Is there another way to handle this?
  override def decode(s: String): Option[Password] =
    NonEmptyString
      .decode(s)
      .flatMap(s =>
        Option
          .when(s.toString.startsWith("$2a$"))(s.toString)
          .orElse(s.toString.bcryptSafeBounded.toOption)
      )

  override def validate(fieldName: String, value: String)(using
      Lang
  ): Validation[Password] =
    validate(
      value,
      ValidationError(fieldName, __.ErrorDecodeInvalidPasswordFormat)
    )
}

final case class User(
    _id: ObjectId,
    name: NonEmptyString,
    email: Email,
    password: Password,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Document
    with Timestamps

given EntityEncoder[IO, User] = jsonEncoderOf[IO, User]
given EntityDecoder[IO, User] = jsonOf[IO, User]

object User {
  final case class CreationData(
      name: String,
      email: String,
      password: String
  )
  given EntityDecoder[IO, CreationData] = jsonOf[IO, CreationData]
  given EntityEncoder[IO, CreationData] = jsonEncoderOf[IO, CreationData]

  final case class ValidCreationData(
      name: NonEmptyString,
      email: Email,
      password: Password
  )

  final case class UpdateData(
      name: Option[String],
      email: Option[String],
      password: Option[String]
  )
  given EntityDecoder[IO, UpdateData] = jsonOf[IO, UpdateData]
  given EntityEncoder[IO, UpdateData] = jsonEncoderOf[IO, UpdateData]

  final case class ValidUpdateData(
      name: Option[NonEmptyString],
      email: Option[Email],
      password: Option[Password]
  )

  final case class RefreshTokenData(refreshToken: String)

  given EntityDecoder[IO, RefreshTokenData] = jsonOf[IO, RefreshTokenData]
  given EntityEncoder[IO, RefreshTokenData] =
    jsonEncoderOf[IO, RefreshTokenData]

  final case class LoginData(email: Email, password: String)

  given EntityDecoder[IO, LoginData] = jsonOf[IO, LoginData]
  given EntityEncoder[IO, LoginData] = jsonEncoderOf[IO, LoginData]

  def validateCreationData(
      data: CreationData
  )(using Lang): Validation[ValidCreationData] =
    (
      NonEmptyString.validate("name", data.name),
      Email.validate("email", data.email),
      Password.validate("password", data.password)
    ).mapN(
      ((name, email, password) => ValidCreationData(name, email, password))
    )

  def validateUpdateData(
      data: UpdateData
  )(using Lang): Validation[ValidUpdateData] = {
    (
      NonEmptyString.validateOptional("name", data.name),
      Email.validateOptional("email", data.email),
      Password.validateOptional("password", data.password)
    ).mapN((name, email, password) => ValidUpdateData(name, email, password))
  }

  def fromCreationData(
      data: CreationData
  )(using Lang): Result[User] =
    for
      validatedData <- validateCreationData(data).toResult
      user <- Right(
        User(
          _id = ObjectId(),
          name = validatedData.name,
          email = validatedData.email,
          password = validatedData.password,
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

  def update(
      data: User.UpdateData
  )(using customer: User)(using Lang): IO[Result[User]] = {
    for
      validatedData <- IO(User.validateUpdateData(data))
      existingUserError <- validatedData.toResult
        .liftValidate(data =>
          data.email.lift(email =>
            collection
              .use(
                _.find(
                  Filter.eq("email", email).and(Filter.ne("_id", customer._id))
                ).first
              )
              .map(_.map(_ => Error(Conflict, __.ErrorUserConflict)))
          )
        )
      result <- validatedData.toResult.lift(data =>
        existingUserError.toLeftLift {
          val updates = List(
            data.name.map(Updates.set("name", _)).toList,
            data.email.map(Updates.set("email", _)).toList,
            data.password.map(Updates.set("password", _)).toList,
            Some(
              Updates.set(
                "updatedAt",
                BsonDateTime(System.currentTimeMillis).getValue
              )
            ).toList
          ).flatten

          collection.update(customer, Updates.combine(updates.asJava))
        }
      )
    yield result
  }

  def login(
      data: User.LoginData
  )(using Lang): IO[Result[JWT.AuthTokens]] =
    for
      user <- collection
        .use(_.find(Filter.eq("email", data.email)).first)
        .map(_.toRight(Error(BadRequest, __.ErrorInvalidEmailOrPassword)))
      userWithRightPassword = user.flatMap(user =>
        Either.cond(
          data.password
            .isBcryptedSafeBounded(user.password.toString)
            .getOrElse(false),
          user,
          Error(BadRequest, __.ErrorInvalidEmailOrPassword)
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
