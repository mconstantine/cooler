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
import it.mconst.cooler.utils.DatabaseName
import it.mconst.cooler.utils.DbDocument
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import java.time.LocalDate
import mongo4cats.bson.Document
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.bson.conversions.Bson
import org.http4s.circe.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import org.http4s.Status

final case class ProjectCashData(at: BsonDateTime, amount: BigDecimal)
final case class ProjectInvoiceData(number: NonEmptyString, date: BsonDateTime)

final case class ProjectQueryFilters(
    cashed: Option[Boolean],
    withInvoiceData: Option[Boolean],
    started: Option[Boolean],
    ended: Option[Boolean]
)
object ProjectQueryFilters {
  def empty: ProjectQueryFilters = ProjectQueryFilters(
    none[Boolean],
    none[Boolean],
    none[Boolean],
    none[Boolean]
  )
}

final case class ProjectCashedBalance(balance: NonNegativeNumber)
object ProjectCashedBalance {
  given EntityEncoder[IO, ProjectCashedBalance] =
    jsonEncoderOf[IO, ProjectCashedBalance]

  def empty = ProjectCashedBalance(NonNegativeNumber.unsafe(0f))
}

sealed abstract trait Project(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    expectedBudget: Option[NonNegativeNumber],
    invoiceData: Option[ProjectInvoiceData],
    cashData: Option[ProjectCashData],
    startTime: BsonDateTime,
    endTime: BsonDateTime,
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
    expectedBudget: Option[NonNegativeNumber],
    invoiceData: Option[ProjectInvoiceData],
    cashData: Option[ProjectCashData],
    startTime: BsonDateTime,
    endTime: BsonDateTime,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Project(
      _id,
      name,
      description,
      expectedBudget,
      invoiceData,
      cashData,
      startTime,
      endTime,
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
    expectedBudget: Option[NonNegativeNumber],
    invoiceData: Option[ProjectInvoiceData],
    cashData: Option[ProjectCashData],
    client: ClientLabel,
    startTime: BsonDateTime,
    endTime: BsonDateTime,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Project(
      _id,
      name,
      description,
      expectedBudget,
      invoiceData,
      cashData,
      startTime,
      endTime,
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
    expectedBudget: Option[NonNegativeNumber],
    invoiceData: Option[ProjectInvoiceData],
    cashData: Option[ProjectCashData],
    startTime: BsonDateTime,
    endTime: BsonDateTime,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
    client: ClientLabel,
    expectedWorkingHours: NonNegativeNumber,
    actualWorkingHours: NonNegativeNumber,
    budget: NonNegativeNumber,
    balance: NonNegativeNumber
) extends Project(
      _id,
      name,
      description,
      expectedBudget,
      invoiceData,
      cashData,
      startTime,
      endTime,
      createdAt,
      updatedAt
    )

object ProjectWithStats {
  given EntityEncoder[IO, ProjectWithStats] =
    jsonEncoderOf[IO, ProjectWithStats]
}

object Project {
  final case class InvoiceDataInput(number: String, date: String)

  final case class InputData(
      client: String,
      name: String,
      description: Option[String],
      expectedBudget: Option[BigDecimal],
      invoiceData: Option[InvoiceDataInput],
      cashData: Option[ProjectCashData],
      startTime: String,
      endTime: String
  )

  given EntityDecoder[IO, InputData] = jsonOf[IO, InputData]
  given EntityEncoder[IO, InputData] = jsonEncoderOf[IO, InputData]

  final case class ValidInputData(
      client: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      expectedBudget: Option[NonNegativeNumber],
      invoiceData: Option[ProjectInvoiceData],
      cashData: Option[ProjectCashData],
      startTime: BsonDateTime,
      endTime: BsonDateTime
  )

  def validateInputData(data: InputData)(using
      Lang
  ): Validation[ValidInputData] = (
    data.client.validateObjectId("client"),
    NonEmptyString.validate("name", data.name),
    NonEmptyString.validateOptional("description", data.description),
    NonNegativeNumber.validateOptional("expectedBudget", data.expectedBudget),
    data.startTime.validateBsonDateTime("startTime"),
    data.endTime.validateBsonDateTime("endTime"),
    NonEmptyString.validateOptional(
      "invoiceData.number",
      data.invoiceData.map(_.number)
    ),
    data.invoiceData
      .map(_.date)
      .validateOptionalBsonDateTime("invoiceData.date")
  ).mapN(
    (
        client,
        name,
        description,
        expectedBudget,
        startTime,
        endTime,
        invoiceDataNumber,
        invoiceDataDate
    ) =>
      ValidInputData(
        client,
        name,
        description,
        expectedBudget,
        data.invoiceData.map(data =>
          ProjectInvoiceData(invoiceDataNumber.get, invoiceDataDate.get)
        ),
        data.cashData,
        startTime,
        endTime
      )
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
      data.invoiceData,
      data.cashData,
      data.startTime,
      data.endTime,
      BsonDateTime(System.currentTimeMillis),
      BsonDateTime(System.currentTimeMillis)
    )
  )
}

object Projects {
  def collection(using DatabaseName) =
    Collection[IO, Project.InputData, DbProject]("projects")

  def labelsStages(using DatabaseName) = Seq(
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
    ),
    Aggregates.project(Document("c" -> 0))
  )

  def create(
      data: Project.InputData
  )(using
      customer: User
  )(using Lang, DatabaseName): EitherT[IO, Error, ProjectWithClientLabel] =
    collection.use { c =>
      for
        data <- EitherT.fromEither[IO](Project.fromInputData(data))
        _ <- Clients.findById(data.client)
        result <- c.create(data)
        project <- findByIdNoStats(result)
      yield project
    }

  def findByIdNoStats(_id: ObjectId)(using customer: User)(using
      Lang,
      DatabaseName
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
  )(using
      customer: User
  )(using Lang, DatabaseName): EitherT[IO, Error, ProjectWithStats] =
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
                Field(
                  "budget",
                  Document(
                    "$cond" -> Document(
                      "if" -> Document(
                        "$gt" -> Seq(Document("$size" -> "$tasks"), 0)
                      ),
                      "then" -> Document("$sum" -> "$tasks.budget"),
                      "else" -> Document(
                        "$ifNull" -> Seq("$expectedBudget", 0)
                      )
                    )
                  )
                ),
                Field("balance", Document("$sum" -> "$tasks.balance"))
              ),
              Aggregates.project(Document("tasks" -> 0))
            )
          ).first.map(
            _.flatMap(project =>
              (
                NonNegativeNumber.decode(
                  project.actualWorkingHours.toNumber / 3600f
                ),
                NonNegativeNumber.decode(project.balance.toNumber / 3600f)
              )
                .mapN((actualWorkingHours, balance) =>
                  ProjectWithStats(
                    project._id,
                    project.name,
                    project.description,
                    project.expectedBudget,
                    project.invoiceData,
                    project.cashData,
                    project.startTime,
                    project.endTime,
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

  def find(query: CursorQuery, filters: ProjectQueryFilters)(using
      customer: User
  )(using
      Lang,
      DatabaseName
  ): EitherT[IO, Error, Cursor[ProjectWithClientLabel]] = {
    import scala.jdk.CollectionConverters.*

    val now = BsonDateTime(LocalDate.now.toEpochDay * 86400000).toISOString
    val userFilters: Iterable[Bson] = Iterable(Filters.eq("user", customer._id))

    val cashDataFilters: Iterable[Bson] = filters.cashed match
      case Some(true)  => Iterable(Filters.ne("cashData", null))
      case Some(false) => Iterable(Filters.eq("cashData", null))
      case None        => Iterable.empty

    val invoiceDataFilters: Iterable[Bson] = filters.withInvoiceData match
      case Some(true)  => Iterable(Filters.ne("invoiceData", null))
      case Some(false) => Iterable(Filters.eq("invoiceData", null))
      case None        => Iterable.empty

    val startTimeFilters: Iterable[Bson] = filters.started match
      case Some(true)  => Iterable(Filters.lte("startTime", now))
      case Some(false) => Iterable(Filters.gte("startTime", now))
      case None        => Iterable.empty

    val endTimeFilters: Iterable[Bson] = filters.ended match
      case Some(true)  => Iterable(Filters.lte("endTime", now))
      case Some(false) => Iterable(Filters.gte("endTime", now))
      case None        => Iterable.empty

    val matchFilters =
      userFilters ++ cashDataFilters ++ invoiceDataFilters ++ startTimeFilters ++ endTimeFilters

    collection.use(
      _.find[ProjectWithClientLabel](
        "name",
        Seq(
          Aggregates.`match`(Filters.and(matchFilters.asJava))
        ) ++ labelsStages
      )(query)
    )
  }

  def getLatest(query: CursorQuery)(using
      customer: User
  )(using
      Lang,
      DatabaseName
  ): EitherT[IO, Error, Cursor[ProjectWithClientLabel]] =
    collection.use(
      _.find[ProjectWithClientLabel](
        "updatedAt",
        Seq(
          Aggregates.`match`(Filters.eq("user", customer._id))
        ) ++ labelsStages
      )(query)
    )

  def update(_id: ObjectId, data: Project.InputData)(using customer: User)(using
      Lang,
      DatabaseName
  ): EitherT[IO, Error, ProjectWithStats] =
    for
      project <- findByIdNoStats(_id)
      data <- EitherT.fromEither[IO](Project.validateInputData(data).toResult)
      client <-
        if project.client._id == data.client then
          EitherT.rightT[IO, Error](project.client._id)
        else Clients.findById(data.client).map(_._id)
      _ <- collection
        .useWithCodec[
          ProjectCashData,
          ProjectInvoiceData,
          BigDecimal,
          Error,
          UpdateResult
        ](
          _.update(
            project._id,
            Collection.Update
              .`with`("client" -> client)
              .`with`("name" -> data.name)
              .`with`(
                "description" -> data.description,
                Collection.UpdateStrategy.UnsetIfEmpty
              )
              .`with`(
                "expectedBudget" -> data.expectedBudget,
                Collection.UpdateStrategy.UnsetIfEmpty
              )
              .`with`(
                "invoiceData" -> data.invoiceData,
                Collection.UpdateStrategy.UnsetIfEmpty
              )
              .`with`(
                "cashData" -> data.cashData,
                Collection.UpdateStrategy.UnsetIfEmpty
              )
              .`with`("startTime" -> data.startTime)
              .`with`("endTime" -> data.endTime)
              .build
          )
        )
      result <- findById(_id)
    yield result

  def delete(_id: ObjectId)(using customer: User)(using
      Lang,
      DatabaseName
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
  )(using DatabaseName): IO[ProjectCashedBalance] = {
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
