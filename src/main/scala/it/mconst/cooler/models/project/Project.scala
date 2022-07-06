package it.mconst.cooler.models.project

import cats.data.EitherT
import cats.data.NonEmptyChain
import cats.data.OptionT
import cats.effect.IO
import cats.syntax.all.none
import cats.syntax.apply.*
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.BsonField
import com.mongodb.client.model.Field
import com.mongodb.client.model.Filters
import com.mongodb.client.result.UpdateResult
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.Decoder.Result
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.*
import io.circe.HCursor
import io.circe.Json
import io.circe.syntax.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.session.Session
import it.mconst.cooler.models.session.Sessions
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.user.User
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

final case class ProjectCashData(at: BsonDateTime, amount: BigDecimal)
final case class ProjectCashedBalance(balance: NonNegativeFloat)

object ProjectCashedBalance {
  given EntityEncoder[IO, ProjectCashedBalance] =
    jsonEncoderOf[IO, ProjectCashedBalance]

  def empty = ProjectCashedBalance(NonNegativeFloat.unsafe(0f))
}

sealed abstract trait Project(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument {}

final case class ClientLabel(_id: ObjectId, name: NonEmptyString)

final case class DbProject(
    _id: ObjectId,
    val client: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Project(
      _id,
      name,
      description,
      cashData,
      createdAt,
      updatedAt
    )

object DbProject {
  given EntityEncoder[IO, DbProject] = jsonEncoderOf[IO, DbProject]
  given EntityEncoder[IO, Cursor[DbProject]] =
    jsonEncoderOf[IO, Cursor[DbProject]]
}

final case class ProjectWithClientLabel(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
    client: ClientLabel
) extends Project(
      _id,
      name,
      description,
      cashData,
      createdAt,
      updatedAt
    )

object ProjectWithClientLabel {
  given EntityEncoder[IO, Cursor[ProjectWithClientLabel]] =
    jsonEncoderOf[IO, Cursor[ProjectWithClientLabel]]
}

final case class ProjectWithStats(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
    client: ClientLabel,
    expectedWorkingHours: NonNegativeFloat,
    actualWorkingHours: NonNegativeFloat,
    budget: NonNegativeFloat,
    balance: NonNegativeFloat
) extends Project(
      _id,
      name,
      description,
      cashData,
      createdAt,
      updatedAt
    )

object ProjectWithStats {
  given EntityEncoder[IO, ProjectWithStats] =
    jsonEncoderOf[IO, ProjectWithStats]
}

object Project {
  final case class InputData(
      client: String,
      name: String,
      description: Option[String],
      cashData: Option[ProjectCashData]
  )

  given EntityDecoder[IO, InputData] = jsonOf[IO, InputData]
  given EntityEncoder[IO, InputData] = jsonEncoderOf[IO, InputData]

  final case class ValidInputData(
      client: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      cashData: Option[ProjectCashData]
  )

  def validateInputData(data: InputData)(using
      Lang
  ): Validation[ValidInputData] = (
    data.client.validateObjectId("client"),
    NonEmptyString.validate("name", data.name),
    NonEmptyString.validateOptional("description", data.description)
  ).mapN((client, name, description) =>
    ValidInputData(client, name, description, data.cashData)
  )

  def fromInputData(data: InputData)(using
      Lang
  ): Either[Error, DbProject] = validateInputData(data).toResult.map(data =>
    DbProject(
      ObjectId(),
      data.client,
      data.name,
      data.description,
      data.cashData,
      BsonDateTime(System.currentTimeMillis),
      BsonDateTime(System.currentTimeMillis)
    )
  )
}

object Projects {
  val collection = Collection[IO, Project.InputData, DbProject]("projects")

  def create(
      data: Project.InputData
  )(using customer: User)(using Lang): EitherT[IO, Error, DbProject] =
    collection.use { c =>
      for
        data <- EitherT.fromEither[IO](Project.fromInputData(data))
        _ <- Clients.findById(data.client)
        project <- c.create(data)
      yield project
    }

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, ProjectWithStats] =
    EitherT.fromOptionF(
      collection.use(
        _.raw(
          _.aggregateWithCodec[ProjectWithStats](
            Seq(
              Aggregates.`match`(Filters.eq("_id", _id)),
              Aggregates.lookup(
                Clients.collection.name,
                "client",
                "_id",
                "c"
              ),
              Aggregates.unwind("$c"),
              Aggregates.`match`(Filters.eq("c.user", customer._id)),
              Aggregates.addFields(
                Field(
                  "client",
                  Document(
                    "_id" -> "$c._id",
                    "name" -> Document(
                      "$cond" -> Document(
                        "if" -> Document(
                          "$gt" -> List("$c.firstName", null)
                        ),
                        "then" -> Document(
                          "$concat" -> List(
                            "$c.firstName",
                            " ",
                            "$c.lastName"
                          )
                        ),
                        "else" -> "$c.businessName"
                      )
                    )
                  )
                )
              ),
              Aggregates.project(Document("c" -> 0)),
              Document(
                "$lookup" -> Document(
                  "from" -> "tasks",
                  "localField" -> "_id",
                  "foreignField" -> "project",
                  "as" -> "tasks",
                  "pipeline" -> Seq(
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
              Aggregates.addFields(
                Field(
                  "expectedWorkingHours",
                  Document("$sum" -> "$tasks.expectedWorkingHours")
                ),
                Field(
                  "actualWorkingHours",
                  Document("$sum" -> "$tasks.actualWorkingHours")
                ),
                Field("budget", Document("$sum" -> "$tasks.budget")),
                Field("balance", Document("$sum" -> "$tasks.balance"))
              ),
              Aggregates.project(Document("tasks" -> 0))
            )
          ).first
        )
      ),
      Error(Status.NotFound, __.ErrorProjectNotFound)
    )

  def find(query: CursorQuery)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Cursor[ProjectWithClientLabel]] =
    collection.use(
      _.find[ProjectWithClientLabel](
        "name",
        Seq(
          Aggregates
            .lookup(Clients.collection.name, "client", "_id", "c"),
          Aggregates.unwind("$c"),
          Aggregates.`match`(Filters.eq("c.user", customer._id)),
          Aggregates.addFields(
            Field(
              "client",
              Document(
                "_id" -> "$c._id",
                "name" -> Document(
                  "$cond" -> Document(
                    "if" -> Document(
                      "$gt" -> List("$c.firstName", null)
                    ),
                    "then" -> Document(
                      "$concat" -> List("$c.firstName", " ", "$c.lastName")
                    ),
                    "else" -> "$c.businessName"
                  )
                )
              )
            )
          ),
          Aggregates.project(Document("c" -> 0))
        )
      )(query)
    )

  def getLatest(query: CursorQuery)(using
      customer: User
  )(using Lang): EitherT[IO, Error, Cursor[ProjectWithClientLabel]] =
    collection.use(
      _.find[ProjectWithClientLabel](
        "updatedAt",
        Seq(
          Aggregates
            .lookup(Clients.collection.name, "client", "_id", "c"),
          Aggregates.unwind("$c"),
          Aggregates.`match`(Filters.eq("c.user", customer._id)),
          Aggregates.addFields(
            Field(
              "client",
              Document(
                "_id" -> "$c._id",
                "name" -> Document(
                  "$cond" -> Document(
                    "if" -> Document(
                      "$gt" -> List("$c.firstName", null)
                    ),
                    "then" -> Document(
                      "$concat" -> List("$c.firstName", " ", "$c.lastName")
                    ),
                    "else" -> "$c.businessName"
                  )
                )
              )
            )
          ),
          Aggregates.project(Document("c" -> 0))
        )
      )(query)
    )

  def update(_id: ObjectId, data: Project.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, ProjectWithStats] =
    for
      project <- findById(_id)
      data <- EitherT.fromEither[IO](Project.validateInputData(data).toResult)
      client <- Clients.findById(data.client)
      _ <- collection
        .useWithCodec[ProjectCashData, Error, UpdateResult](
          _.update(
            project._id,
            collection.Update
              .`with`("client" -> client._id)
              .`with`("name" -> data.name)
              .`with`(
                "description" -> data.description,
                collection.UpdateStrategy.UnsetIfEmpty
              )
              .`with`(
                "cashData" -> data.cashData,
                collection.UpdateStrategy.UnsetIfEmpty
              )
              .build
          )
        )
      result <- findById(_id)
    yield result

  def delete(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, ProjectWithStats] =
    for
      project <- findById(_id)
      _ <- collection.use(_.delete(project._id))
      sessions <- EitherT.right(
        Sessions.collection.use(
          _.raw(
            _.aggregateWithCodec[Session](
              Seq(
                Aggregates.lookup("tasks", "task", "_id", "task"),
                Aggregates.unwind("$task"),
                Aggregates.`match`(Filters.eq("task.project", project._id)),
                Aggregates.addFields(Field("task", "$task._id"))
              )
            ).all
          )
        )
      )
      _ <- EitherT.right(
        Sessions.collection.use(
          _.raw(_.deleteMany(Filter.in("_id", Seq.from(sessions.map(_._id)))))
        )
      )
      _ <- EitherT.right(
        Tasks.collection.use(
          _.raw(_.deleteMany(Filter.eq("project", project._id)))
        )
      )
    yield project

  def getCashedBalance(since: BsonDateTime, to: Option[BsonDateTime])(using
      customer: User
  ): IO[ProjectCashedBalance] = {
    collection
      .use(
        _.raw(
          _.aggregateWithCodec[ProjectCashedBalance](
            Seq(
              Aggregates.lookup("clients", "client", "_id", "client"),
              Aggregates.unwind("$client"),
              Aggregates.`match`(
                Filters.and(
                  Filters.eq("client.user", customer._id),
                  Filters.and(
                    Filters.gte("cashData.at", since.toISOString),
                    Filters.lt(
                      "cashData.at",
                      to.getOrElse(BsonDateTime(System.currentTimeMillis))
                        .toISOString
                    )
                  )
                )
              ),
              Aggregates.group(
                "$client.user",
                BsonField("balance", Document("$sum" -> "$cashData.amount"))
              ),
              Aggregates.project(Document("_id" -> 0))
            )
          ).first
            .map(_.getOrElse(ProjectCashedBalance.empty))
        )
      )
  }
}
