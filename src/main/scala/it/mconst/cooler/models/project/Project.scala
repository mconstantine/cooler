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
import it.mconst.cooler.models.client.ClientType
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
    expectedBudget: Option[NonNegativeFloat],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument {}

final case class ClientLabel(
    _id: ObjectId,
    `type`: ClientType,
    name: NonEmptyString
)

final case class DbProject(
    _id: ObjectId,
    val client: ObjectId,
    val user: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    expectedBudget: Option[NonNegativeFloat],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Project(
      _id,
      name,
      description,
      expectedBudget,
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
    expectedBudget: Option[NonNegativeFloat],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
    client: ClientLabel
) extends Project(
      _id,
      name,
      description,
      expectedBudget,
      cashData,
      createdAt,
      updatedAt
    )

object ProjectWithClientLabel {
  given EntityEncoder[IO, ProjectWithClientLabel] =
    jsonEncoderOf[IO, ProjectWithClientLabel]

  given EntityEncoder[IO, Cursor[ProjectWithClientLabel]] =
    jsonEncoderOf[IO, Cursor[ProjectWithClientLabel]]
}

final case class ProjectWithStats(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    expectedBudget: Option[NonNegativeFloat],
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
      expectedBudget,
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
      expectedBudget: Option[Float],
      cashData: Option[ProjectCashData]
  )

  given EntityDecoder[IO, InputData] = jsonOf[IO, InputData]
  given EntityEncoder[IO, InputData] = jsonEncoderOf[IO, InputData]

  final case class ValidInputData(
      client: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      expectedBudget: Option[NonNegativeFloat],
      cashData: Option[ProjectCashData]
  )

  def validateInputData(data: InputData)(using
      Lang
  ): Validation[ValidInputData] = (
    data.client.validateObjectId("client"),
    NonEmptyString.validate("name", data.name),
    NonEmptyString.validateOptional("description", data.description),
    NonNegativeFloat.validateOptional("expectedBudget", data.expectedBudget)
  ).mapN((client, name, description, expectedBudget) =>
    ValidInputData(client, name, description, expectedBudget, data.cashData)
  )

  def fromInputData(data: InputData)(using customer: User)(using
      Lang
  ): Either[Error, DbProject] = validateInputData(data).toResult.map(data =>
    DbProject(
      ObjectId(),
      data.client,
      customer._id,
      data.name,
      data.description,
      data.expectedBudget,
      data.cashData,
      BsonDateTime(System.currentTimeMillis),
      BsonDateTime(System.currentTimeMillis)
    )
  )
}

object Projects {
  val collection = Collection[IO, Project.InputData, DbProject]("projects")

  def labelsStages = Seq(
    Aggregates.lookup(Clients.collection.name, "client", "_id", "c"),
    Aggregates.unwind("$c"),
    Aggregates.addFields(
      Field(
        "client",
        Document(
          "_id" -> "$c._id",
          "type" -> "$c.type",
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
    )
  )

  def create(
      data: Project.InputData
  )(using
      customer: User
  )(using Lang): EitherT[IO, Error, ProjectWithClientLabel] =
    collection.use { c =>
      for
        data <- EitherT.fromEither[IO](Project.fromInputData(data))
        _ <- Clients.findById(data.client)
        result <- c.create(data)
        project <- findByIdNoStats(result)
      yield project
    }

  def findByIdNoStats(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, ProjectWithClientLabel] = EitherT.fromOptionF(
    collection.use(
      _.raw(
        _.aggregateWithCodec[ProjectWithClientLabel](
          Seq(
            Aggregates.`match`(
              Filters.and(
                Filters.eq("user", customer._id),
                Filters.eq("_id", _id)
              )
            )
          ) ++ labelsStages
        ).first
      )
    ),
    Error(Status.NotFound, __.ErrorProjectNotFound)
  )

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, ProjectWithStats] =
    EitherT.fromOptionF(
      collection.use(
        _.raw(
          _.aggregateWithCodec[ProjectWithStats](
            Seq(
              Aggregates.`match`(
                Filters.and(
                  Filters.eq("user", customer._id),
                  Filters.eq("_id", _id)
                )
              )
            ) ++ labelsStages ++ Seq(
              Document(
                "$lookup" -> Document(
                  "from" -> Tasks.collection.name,
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
          ).first.map(
            _.flatMap(project =>
              (
                NonNegativeFloat.decode(
                  project.actualWorkingHours.toFloat / 3600f
                ),
                NonNegativeFloat.decode(project.balance.toFloat / 3600f)
              )
                .mapN((actualWorkingHours, balance) =>
                  ProjectWithStats(
                    project._id,
                    project.name,
                    project.description,
                    project.expectedBudget,
                    project.cashData,
                    project.createdAt,
                    project.updatedAt,
                    project.client,
                    project.expectedWorkingHours,
                    actualWorkingHours,
                    project.budget,
                    balance
                  )
                )
            )
          )
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
          Aggregates.`match`(Filters.eq("user", customer._id))
        ) ++ labelsStages
      )(query)
    )

  def getLatest(query: CursorQuery)(using
      customer: User
  )(using Lang): EitherT[IO, Error, Cursor[ProjectWithClientLabel]] =
    collection.use(
      _.find[ProjectWithClientLabel](
        "updatedAt",
        Seq(
          Aggregates.`match`(Filters.eq("user", customer._id))
        ) ++ labelsStages
      )(query)
    )

  def update(_id: ObjectId, data: Project.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, ProjectWithStats] =
    for
      project <- findByIdNoStats(_id)
      data <- EitherT.fromEither[IO](Project.validateInputData(data).toResult)
      client <-
        if project.client._id == data.client then
          EitherT.rightT[IO, Error](project.client._id)
        else Clients.findById(data.client).map(_._id)
      _ <- collection
        .useWithCodec[ProjectCashData, Error, UpdateResult](
          _.update(
            project._id,
            collection.Update
              .`with`("client" -> client)
              .`with`("name" -> data.name)
              .`with`(
                "description" -> data.description,
                collection.UpdateStrategy.UnsetIfEmpty
              )
              .`with`(
                "expectedBudget" -> data.expectedBudget,
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
      _ <- EitherT.right(
        Tasks.collection.use(
          _.raw(_.deleteMany(Filter.eq("project", project._id)))
        )
      )
      _ <- EitherT.right(
        Sessions.collection.use(
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
              Aggregates.`match`(Filters.eq("user", customer._id)),
              Aggregates.lookup(
                Clients.collection.name,
                "client",
                "_id",
                "client"
              ),
              Aggregates.unwind("$client"),
              Aggregates.`match`(
                Filters.and(
                  Filters.gte("cashData.at", since.toISOString),
                  Filters.lt(
                    "cashData.at",
                    to.getOrElse(BsonDateTime(System.currentTimeMillis))
                      .toISOString
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
