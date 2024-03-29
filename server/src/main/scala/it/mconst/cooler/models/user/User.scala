package it.mconst.cooler.models.user

import cats.data.EitherT
import cats.data.OptionT
import cats.effect.IO
import cats.syntax.apply.*
import com.github.t3hnar.bcrypt.*
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.BsonField
import com.mongodb.client.model.Field
import com.mongodb.client.model.Filters
import com.mongodb.client.model.UnwindOptions
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.session.Session
import it.mconst.cooler.models.session.Sessions
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.tax.Taxes
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.DatabaseName
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
    expectedWorkingHours: NonNegativeNumber,
    actualWorkingHours: NonNegativeNumber,
    budget: NonNegativeNumber,
    balance: NonNegativeNumber
)
object UserStats {
  given EntityEncoder[IO, UserStats] = jsonEncoderOf[IO, UserStats]

  def empty = UserStats(
    NonNegativeNumber.unsafe(0f),
    NonNegativeNumber.unsafe(0f),
    NonNegativeNumber.unsafe(0f),
    NonNegativeNumber.unsafe(0f)
  )
}

final case class CashPerMonth(monthDate: BsonDateTime, cash: BigDecimal)
object CashPerMonth {
  given EntityEncoder[IO, Iterable[CashPerMonth]] =
    jsonEncoderOf[IO, Iterable[CashPerMonth]]
}

object User {
  given EntityEncoder[IO, User] = jsonEncoderOf[IO, User]

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
  def collection(using DatabaseName) =
    Collection[IO, User.CreationData, User]("users")

  def create(
      user: User.CreationData
  )(using
      customer: Option[User]
  )(using Lang, DatabaseName): EitherT[IO, Error, User] =
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
          c.findOne[User](Filter.eq("email", user.email))
            .toOption
            .map(_ => Error(Status.Conflict, __.ErrorUserConflict))
        )
        .toLeft[User](null)
        .flatMap(_ =>
          EitherT
            .fromEither(User.fromCreationData(user))
            .flatMap(c.createAndReturn)
        )
    )

  def getStats(
      since: BsonDateTime,
      to: Option[BsonDateTime]
  )(using customer: User)(using DatabaseName): IO[UserStats] =
    Projects.collection.use(c =>
      c.raw(
        _.aggregateWithCodec[UserStats](
          Seq(
            Aggregates.`match`(
              Filters.and(
                Filters.eq("user", customer._id),
                Filters.gte("startTime", since.toISOString),
                Filters.lt(
                  "endTime",
                  to.getOrElse(BsonDateTime(System.currentTimeMillis))
                    .toISOString
                )
              )
            ),
            Aggregates.project(
              Document(
                "_id" -> 1,
                "expectedBudget" -> Document(
                  "$ifNull" -> Seq("$expectedBudget", 0)
                )
              )
            ),
            Document(
              "$lookup" -> Document(
                "from" -> Tasks.collection.name,
                "localField" -> "_id",
                "foreignField" -> "project",
                "as" -> "tasks",
                "pipeline" -> Seq(
                  Aggregates.`match`(
                    Filters.and(
                      Filters.gte("startTime", since.toISOString),
                      Filters.lt(
                        "startTime",
                        to.getOrElse(BsonDateTime(System.currentTimeMillis))
                          .toISOString
                      )
                    )
                  ),
                  Aggregates.project(
                    Document(
                      "_id" -> 1,
                      "expectedWorkingHours" -> 1,
                      "hourlyCost" -> 1
                    )
                  ),
                  Aggregates.addFields(
                    Field(
                      "budget",
                      Document(
                        "$multiply" -> Seq(
                          "$expectedWorkingHours",
                          "$hourlyCost"
                        )
                      )
                    )
                  ),
                  Document(
                    "$lookup" -> Document(
                      "from" -> Sessions.collection.name,
                      "localField" -> "_id",
                      "foreignField" -> "task",
                      "as" -> "sessions",
                      "pipeline" -> Seq(
                        Aggregates.project(
                          Document(
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
                                "unit" -> "second"
                              )
                            )
                          )
                        )
                      )
                    )
                  ),
                  Aggregates.addFields(
                    Field(
                      "actualWorkingHours",
                      Document(
                        "$sum" -> "$sessions.actualWorkingHours"
                      )
                    )
                  ),
                  Aggregates.addFields(
                    Field(
                      "balance",
                      Document(
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
            Aggregates.project(
              Document(
                "_id" -> 1,
                "expectedWorkingHours" ->
                  Document("$sum" -> "$tasks.expectedWorkingHours"),
                "actualWorkingHours" ->
                  Document("$sum" -> "$tasks.actualWorkingHours"),
                "budget" ->
                  Document(
                    "$cond" -> Document(
                      "if" -> Document(
                        "$gt" -> Seq(Document("$size" -> "$tasks"), 0)
                      ),
                      "then" -> Document("$sum" -> "$tasks.budget"),
                      "else" -> "$expectedBudget"
                    )
                  ),
                "balance" -> Document("$sum" -> "$tasks.balance")
              )
            ),
            Aggregates.group(
              null,
              BsonField(
                "expectedWorkingHours",
                Document("$sum" -> "$expectedWorkingHours")
              ),
              BsonField("budget", Document("$sum" -> "$budget")),
              BsonField(
                "actualWorkingHours",
                Document("$sum" -> "$actualWorkingHours")
              ),
              BsonField("balance", Document("$sum" -> "$balance"))
            ),
            Aggregates.project(
              Document(
                "_id" -> 0,
                "expectedWorkingHours" -> 1,
                "budget" -> 1,
                "actualWorkingHours" -> Document(
                  "$divide" -> Seq("$actualWorkingHours", 3600)
                ),
                "balance" -> Document("$divide" -> Seq("$balance", 3600))
              )
            )
          )
        ).first.map(_.getOrElse(UserStats.empty))
      )
    )

  def getAvgCashPerMonth(since: BsonDateTime, to: Option[BsonDateTime])(using
      customer: User
  )(using DatabaseName): IO[Iterable[CashPerMonth]] =
    Projects.collection.use(
      _.raw(
        _.aggregateWithCodec[CashPerMonth](
          Seq(
            Aggregates.`match`(
              Filters.and(
                Filters.eq("user", customer._id),
                Filters.ne("cashData", null),
                Filters.gte("cashData.at", since.toISOString),
                Filters.lt(
                  "cashData.at",
                  to.getOrElse(BsonDateTime(System.currentTimeMillis))
                    .toISOString
                )
              )
            ),
            Aggregates.group(
              Document(
                "$dateTrunc" -> Document(
                  "date" -> Document(
                    "$dateFromString" -> Document(
                      "dateString" -> "$cashData.at"
                    )
                  ),
                  "unit" -> "month"
                )
              ),
              BsonField(
                "cash",
                Document(
                  "$sum" -> "$cashData.amount"
                )
              )
            ),
            Aggregates.sort(Document("_id" -> 1)),
            Aggregates.project(
              Document(
                "_id" -> 0,
                "monthDate" -> Document(
                  "$dateToString" -> Document(
                    "date" -> "$_id"
                  )
                ),
                "cash" -> 1
              )
            )
          )
        ).all
      )
    )

  def register(
      user: User.CreationData
  )(using
      Option[User],
      Lang,
      DatabaseName
  ): EitherT[IO, Error, JWT.AuthTokens] =
    create(user).map(JWT.generateAuthTokens(_))

  def update(
      data: User.UpdateData
  )(using customer: User)(using Lang, DatabaseName): EitherT[IO, Error, User] =
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
        _ <- c.update(
          customer._id,
          Collection.Update
            .`with`(
              "name" -> data.name,
              Collection.UpdateStrategy.IgnoreIfEmpty
            )
            .`with`(
              "email" -> data.email,
              Collection.UpdateStrategy.IgnoreIfEmpty
            )
            .`with`(
              "password" -> data.password,
              Collection.UpdateStrategy.IgnoreIfEmpty
            )
            .build
        )
        result <- c.findOne[User](Filter.eq("_id", customer._id))
      yield result
    )

  def login(
      data: User.LoginData
  )(using Lang, DatabaseName): EitherT[IO, Error, JWT.AuthTokens] =
    collection.use { c =>
      val error = Error(Status.BadRequest, __.ErrorInvalidEmailOrPassword)

      c.findOne[User](Filter.eq("email", data.email))
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
  )(using Lang, DatabaseName): EitherT[IO, Error, JWT.AuthTokens] =
    JWT
      .decodeToken(data.refreshToken, JWT.UserRefresh)
      .map(JWT.generateAuthTokens(_))

  def delete(using
      customer: User
  )(using Lang, DatabaseName): EitherT[IO, Error, User] =
    collection.use { c =>
      for
        user <- c.findOne[User](Filter.eq("_id", customer._id))
        _ <- c.delete(user._id)
        _ <- EitherT.right(
          Sessions.collection.use(
            _.raw(_.deleteMany(Filter.eq("user", user._id)))
          )
        )
        _ <- EitherT.right(
          Tasks.collection.use(_.raw(_.deleteMany(Filter.eq("user", user._id))))
        )
        _ <- EitherT.right(
          Projects.collection.use(
            _.raw(_.deleteMany(Filter.eq("user", user._id)))
          )
        )
        _ <- EitherT.right(
          Clients.collection.use(
            _.raw(_.deleteMany(Filter.eq("user", user._id)))
          )
        )
        _ <- EitherT.right(
          Taxes.collection.use(_.raw(_.deleteMany(Filter.eq("user", user._id))))
        )
      yield user
    }
}
