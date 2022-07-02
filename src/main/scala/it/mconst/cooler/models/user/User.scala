package it.mconst.cooler.models.user

import cats.data.EitherT
import cats.data.OptionT
import cats.effect.IO
import cats.syntax.apply.*
import com.github.t3hnar.bcrypt.*
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.BsonField
import com.mongodb.client.model.Filters
import com.mongodb.client.model.UnwindOptions
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.DbDocument
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import mongo4cats.bson.Document
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import org.http4s.Status

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
) extends DbDocument

final case class UserStats(
    expectedWorkingHours: NonNegativeFloat,
    actualWorkingHours: NonNegativeFloat,
    budget: NonNegativeFloat,
    balance: NonNegativeFloat
)

object UserStats {
  def empty = UserStats(
    NonNegativeFloat.unsafe(0f),
    NonNegativeFloat.unsafe(0f),
    NonNegativeFloat.unsafe(0f),
    NonNegativeFloat.unsafe(0f)
  )
}

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
  )(using Lang): Either[Error, User] =
    for
      validatedData <- validateCreationData(data).toResult
      user <- Right(
        User(
          _id = ObjectId(),
          name = validatedData.name,
          email = validatedData.email,
          password = validatedData.password,
          createdAt = BsonDateTime(System.currentTimeMillis),
          updatedAt = BsonDateTime(System.currentTimeMillis)
        )
      )
    yield user
}

object Users {
  val collection = Collection[IO, User.CreationData, User]("users")

  def create(
      user: User.CreationData
  )(using customer: Option[User])(using Lang): EitherT[IO, Error, User] =
    collection.use(c =>
      customer
        .fold(
          OptionT(
            c.raw(_.count)
              .map(n =>
                Option.when(n > 0)(
                  Error(Status.Forbidden, __.ErrorUserRegisterForbidden)
                )
              )
          )
        )(_ => OptionT.none[IO, Error])
        .orElse(
          c.findOne(Filter.eq("email", user.email))
            .toOption
            .map(_ => Error(Status.Conflict, __.ErrorUserConflict))
        )
        .toLeft[User](null)
        .flatMap(_ =>
          EitherT.fromEither(User.fromCreationData(user)).flatMap(c.create)
        )
    )

  def getStats(
      since: BsonDateTime
  )(using customer: User)(using Lang): IO[UserStats] =
    collection.use(c =>
      c.raw(
        _.aggregateWithCodec[UserStats](
          Seq(
            Aggregates.`match`(Filters.eq("_id", customer._id)),
            Aggregates.lookup("clients", "_id", "user", "clients"),
            Aggregates.unwind(
              "$clients",
              UnwindOptions().preserveNullAndEmptyArrays(false)
            ),
            Aggregates.project(
              Document(
                "_id" -> 1,
                "client" -> "$clients._id"
              )
            ),
            Aggregates.lookup("projects", "client", "client", "projects"),
            Aggregates.unwind(
              "$projects",
              UnwindOptions().preserveNullAndEmptyArrays(false)
            ),
            Aggregates.project(
              Document(
                "_id" -> 1,
                "project" -> "$projects._id"
              )
            ),
            Document(
              "$lookup" -> Document(
                "from" -> "tasks",
                "localField" -> "project",
                "foreignField" -> "project",
                "as" -> "tasks",
                "pipeline" -> Seq(
                  Aggregates.`match`(
                    Filters.gte("startTime", since.toISOString)
                  ),
                  Document(
                    "$project" -> Document(
                      "_id" -> 1,
                      "expectedWorkingHours" -> 1,
                      "hourlyCost" -> 1
                    )
                  ),
                  Document(
                    "$addFields" -> Document(
                      "budget" -> Document(
                        "$multiply" -> Seq(
                          "$expectedWorkingHours",
                          "$hourlyCost"
                        )
                      )
                    )
                  ),
                  Document(
                    "$lookup" -> Document(
                      "from" -> "sessions",
                      "localField" -> "_id",
                      "foreignField" -> "task",
                      "as" -> "sessions",
                      "pipeline" -> Seq(
                        Document(
                          "$project" -> Document(
                            "_id" -> 0,
                            "actualWorkingHours" -> Document(
                              "$dateDiff" -> Document(
                                "startDate" -> Document(
                                  "$dateFromString" -> Document(
                                    "dateString" -> "$startTime"
                                  )
                                ),
                                "endDate" -> Document(
                                  "$dateFromString" -> Document(
                                    "dateString" -> "$endTime"
                                  )
                                ),
                                "unit" -> "hour"
                              )
                            )
                          )
                        )
                      )
                    )
                  ),
                  Document(
                    "$addFields" -> Document(
                      "actualWorkingHours" -> Document(
                        "$sum" -> "$sessions.actualWorkingHours"
                      )
                    )
                  ),
                  Document(
                    "$addFields" -> Document(
                      "balance" -> Document(
                        "$multiply" -> Seq(
                          "$actualWorkingHours",
                          "$hourlyCost"
                        )
                      )
                    )
                  )
                )
              )
            ),
            Aggregates.unwind(
              "$tasks",
              UnwindOptions().preserveNullAndEmptyArrays(false)
            ),
            Aggregates.group(
              "$_id",
              BsonField(
                "expectedWorkingHours",
                Document("$sum" -> "$tasks.expectedWorkingHours")
              ),
              BsonField(
                "actualWorkingHours",
                Document("$sum" -> "$tasks.actualWorkingHours")
              ),
              BsonField("budget", Document("$sum" -> "$tasks.budget")),
              BsonField("balance", Document("$sum" -> "$tasks.balance"))
            ),
            Aggregates.project(Document("_id" -> 0))
          )
        ).first.map(_.getOrElse(UserStats.empty))
      )
    )

  def register(
      user: User.CreationData
  )(using Option[User], Lang): EitherT[IO, Error, JWT.AuthTokens] =
    create(user).map(JWT.generateAuthTokens(_))

  def update(
      data: User.UpdateData
  )(using customer: User)(using Lang): EitherT[IO, Error, User] =
    collection.use(c =>
      for
        data <- EitherT
          .fromEither[IO](User.validateUpdateData(data).toResult)
          .flatMap(data =>
            data.email.fold(EitherT.rightT[IO, Error](data))(email =>
              OptionT(
                c.raw(
                  _.find(
                    Filter
                      .eq("email", email)
                      .and(Filter.ne("_id", customer._id))
                  ).first
                )
              ).toLeft(data)
                .leftMap(_ => Error(Status.Conflict, __.ErrorUserConflict))
            )
          )
        result <- c.update(
          customer._id,
          collection.Update
            .`with`(
              "name" -> data.name,
              collection.UpdateStrategy.IgnoreIfEmpty
            )
            .`with`(
              "email" -> data.email,
              collection.UpdateStrategy.IgnoreIfEmpty
            )
            .`with`(
              "password" -> data.password,
              collection.UpdateStrategy.IgnoreIfEmpty
            )
            .build
        )
      yield result
    )

  def login(
      data: User.LoginData
  )(using Lang): EitherT[IO, Error, JWT.AuthTokens] =
    collection.use { c =>
      val error = Error(Status.BadRequest, __.ErrorInvalidEmailOrPassword)

      c.findOne(Filter.eq("email", data.email))
        .leftMap(_ => error)
        .flatMap(user =>
          EitherT.cond(
            data.password
              .isBcryptedSafeBounded(user.password.toString)
              .getOrElse(false),
            user,
            error
          )
        )
        .map(JWT.generateAuthTokens(_))
    }

  def refreshToken(
      data: User.RefreshTokenData
  )(using Lang): EitherT[IO, Error, JWT.AuthTokens] =
    JWT
      .decodeToken(data.refreshToken, JWT.UserRefresh)
      .map(JWT.generateAuthTokens(_))

  def delete(using customer: User)(using Lang): EitherT[IO, Error, User] =
    collection.use(_.delete(customer._id))
}

given EntityEncoder[IO, User] = jsonEncoderOf[IO, User]
given EntityDecoder[IO, User] = jsonOf[IO, User]
given EntityEncoder[IO, UserStats] = jsonEncoderOf[IO, UserStats]
given EntityDecoder[IO, UserStats] = jsonOf[IO, UserStats]
