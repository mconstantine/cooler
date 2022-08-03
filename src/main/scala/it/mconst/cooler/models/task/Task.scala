package it.mconst.cooler.models.task

import cats.data.EitherT
import cats.effect.IO
import cats.syntax.all.none
import cats.syntax.apply.*
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.Field
import com.mongodb.client.model.Filters
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
import it.mconst.cooler.models.project.ClientLabel
import it.mconst.cooler.models.project.DbProject
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.session.Sessions
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.DbDocument
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Translations
import java.time.DayOfWeek
import java.time.LocalDate
import mongo4cats.bson.Document
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.bson.BsonValue
import org.http4s.circe.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import org.http4s.Status
import scala.collection.JavaConverters.*

opaque type WeekdayBitMask = Int

object WeekdayBitMask extends Validator[Int, WeekdayBitMask] {
  override def name = "WeekdayBitMask"

  override def decode(n: Int): Option[WeekdayBitMask] =
    Option.when(n >= 0 && n <= 0x1111111)(n)

  override def validate(fieldName: String, value: Int)(using
      Lang
  ): Validation[WeekdayBitMask] =
    validate(
      value,
      ValidationError(fieldName, __.ErrorDecodeInvalidWeekdayBitMask)
    )
}

extension (weekdayBitMask: WeekdayBitMask) {
  def toInt: Int = weekdayBitMask
}

sealed abstract trait Task(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    startTime: BsonDateTime,
    expectedWorkingHours: PositiveFloat,
    hourlyCost: PositiveFloat,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument

final case class DbTask(
    _id: ObjectId,
    val user: ObjectId,
    val client: ObjectId,
    val project: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    startTime: BsonDateTime,
    expectedWorkingHours: PositiveFloat,
    hourlyCost: PositiveFloat,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Task(
      _id: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      startTime: BsonDateTime,
      expectedWorkingHours: PositiveFloat,
      hourlyCost: PositiveFloat,
      createdAt: BsonDateTime,
      updatedAt: BsonDateTime
    )

final case class ProjectLabel(_id: ObjectId, name: NonEmptyString)

final case class TaskWithLabels(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    startTime: BsonDateTime,
    expectedWorkingHours: PositiveFloat,
    hourlyCost: PositiveFloat,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
    client: ClientLabel,
    project: ProjectLabel
) extends Task(
      _id: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      startTime: BsonDateTime,
      expectedWorkingHours: PositiveFloat,
      hourlyCost: PositiveFloat,
      createdAt: BsonDateTime,
      updatedAt: BsonDateTime
    )

object TaskWithLabels {
  given EntityEncoder[IO, TaskWithLabels] =
    jsonEncoderOf[IO, TaskWithLabels]

  given EntityEncoder[IO, Iterable[TaskWithLabels]] =
    jsonEncoderOf[IO, Iterable[TaskWithLabels]]

  given EntityEncoder[IO, Cursor[TaskWithLabels]] =
    jsonEncoderOf[IO, Cursor[TaskWithLabels]]
}

final case class TaskWithStats(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    startTime: BsonDateTime,
    expectedWorkingHours: PositiveFloat,
    hourlyCost: PositiveFloat,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
    client: ClientLabel,
    project: ProjectLabel,
    actualWorkingHours: NonNegativeFloat
) extends Task(
      _id: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      startTime: BsonDateTime,
      expectedWorkingHours: PositiveFloat,
      hourlyCost: PositiveFloat,
      createdAt: BsonDateTime,
      updatedAt: BsonDateTime
    )

object TaskWithStats {
  given EntityEncoder[IO, TaskWithStats] = jsonEncoderOf[IO, TaskWithStats]
}

object Task {
  final case class InputData(
      project: String,
      name: String,
      description: Option[String],
      startTime: String,
      expectedWorkingHours: Float,
      hourlyCost: Float
  )

  given EntityDecoder[IO, InputData] = jsonOf[IO, InputData]
  given EntityEncoder[IO, InputData] = jsonEncoderOf[IO, InputData]

  final case class BatchInputData(
      project: String,
      name: String,
      startTime: String,
      expectedWorkingHours: Float,
      hourlyCost: Float,
      from: String,
      to: String,
      repeat: Int
  )

  given EntityDecoder[IO, BatchInputData] = jsonOf[IO, BatchInputData]
  given EntityEncoder[IO, BatchInputData] = jsonEncoderOf[IO, BatchInputData]

  final case class ValidInputData(
      project: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      startTime: BsonDateTime,
      expectedWorkingHours: PositiveFloat,
      hourlyCost: PositiveFloat
  )

  final case class ValidBatchInputData(
      project: ObjectId,
      name: NonEmptyString,
      startTime: BsonDateTime,
      expectedWorkingHours: PositiveFloat,
      hourlyCost: PositiveFloat,
      from: BsonDateTime,
      to: BsonDateTime,
      repeat: WeekdayBitMask
  )

  def validateInputData(
      data: InputData
  )(using Lang): Validation[ValidInputData] = (
    data.project.validateObjectId("project"),
    NonEmptyString.validate("name", data.name),
    NonEmptyString.validateOptional("description", data.description),
    data.startTime.validateBsonDateTime("startTime"),
    PositiveFloat.validate("expectedWorkingHours", data.expectedWorkingHours),
    PositiveFloat.validate("hourlyCost", data.hourlyCost)
  ).mapN(
    (project, name, description, startTime, expectedWorkingHours, hourlyCost) =>
      ValidInputData(
        project,
        name,
        description,
        startTime,
        expectedWorkingHours,
        hourlyCost
      )
  )

  def validateBatchInputData(
      data: BatchInputData
  )(using Lang): Validation[ValidBatchInputData] = (
    data.project.validateObjectId("project"),
    NonEmptyString.validate("name", data.name),
    data.startTime.validateBsonDateTime("startTime"),
    PositiveFloat.validate("expectedWorkingHours", data.expectedWorkingHours),
    PositiveFloat.validate("hourlyCost", data.hourlyCost),
    data.from.validateBsonDateTime("from"),
    data.to.validateBsonDateTime("to"),
    WeekdayBitMask.validate("repeat", data.repeat)
  ).mapN(
    (
        project,
        name,
        startTime,
        expectedWorkingHours,
        hourlyCost,
        from,
        to,
        repeat
    ) =>
      ValidBatchInputData(
        project,
        name,
        startTime,
        expectedWorkingHours,
        hourlyCost,
        from,
        to,
        repeat
      )
  )

  def fromInputData(data: InputData, client: ObjectId)(using
      customer: User
  )(using Lang): Either[Error, DbTask] =
    validateInputData(data).toResult.map(data =>
      DbTask(
        ObjectId(),
        customer._id,
        client,
        data.project,
        data.name,
        data.description,
        data.startTime,
        data.expectedWorkingHours,
        data.hourlyCost,
        BsonDateTime(System.currentTimeMillis),
        BsonDateTime(System.currentTimeMillis)
      )
    )

  private def expandDatePlaceholders(
      dateTime: BsonDateTime,
      name: NonEmptyString
  )(using Lang): NonEmptyString = {
    val date =
      LocalDate.ofEpochDay(Math.floor(dateTime.getValue / 86400000).toLong)

    lazy val monthsNamesLong = Translations.getMonthsLongNames
    lazy val monthsNamesShort = Translations.getMonthsShortNames
    lazy val weekdaysNamesLong = Translations.getWeekdaysLongNames
    lazy val weekdaysNamesShort = Translations.getWeekdaysShortNames

    // We can use unsafe here as validData.name is not empty and we don't replace anything with an
    // empty string
    NonEmptyString
      .unsafe(
        name.toString
          .replaceAll("YYYY", date.getYear.toString)
          .replaceAll("YY", date.getYear.toString.slice(2, 4))
          .replaceAll("MMMM", monthsNamesLong(date.getMonth).toString)
          .replaceAll("MMM", monthsNamesShort(date.getMonth).toString)
          .replaceAll(
            "MM",
            if date.getMonthValue < 10 then "0" + date.getMonthValue
            else date.getMonthValue.toString
          )
          .replaceAll("M", date.getMonthValue.toString)
          .replaceAll("DDDD", weekdaysNamesLong(date.getDayOfWeek).toString)
          .replaceAll("DDD", weekdaysNamesShort(date.getDayOfWeek).toString)
          .replaceAll(
            "DD",
            if date.getDayOfMonth < 10 then "0" + date.getDayOfMonth
            else date.getDayOfMonth.toString
          )
          .replaceAll("D", date.getDayOfMonth.toString)
      )
  }

  def fromBatchInputData(data: BatchInputData, client: ObjectId)(using
      customer: User
  )(using
      Lang
  ): Either[Error, List[DbTask]] =
    Task
      .validateBatchInputData(data)
      .toResult
      .map { validData =>
        val weekMask: Map[DayOfWeek, Boolean] = Map(
          DayOfWeek.MONDAY -> ((0x0000001 & data.repeat.toInt) > 0),
          DayOfWeek.TUESDAY -> ((0x0000010 & data.repeat.toInt) > 0),
          DayOfWeek.WEDNESDAY -> ((0x0000100 & data.repeat.toInt) > 0),
          DayOfWeek.THURSDAY -> ((0x0001000 & data.repeat.toInt) > 0),
          DayOfWeek.FRIDAY -> ((0x0010000 & data.repeat.toInt) > 0),
          DayOfWeek.SATURDAY -> ((0x0100000 & data.repeat.toInt) > 0),
          DayOfWeek.SUNDAY -> ((0x1000000 & data.repeat.toInt) > 0)
        )

        val startEpochDay =
          Math.floor(validData.from.getValue / 86400000).toLong

        val startTime = validData.from.getValue - startEpochDay * 86400000
        val endEpochDay = Math.floor(validData.to.getValue / 86400000).toLong

        val validDays = startEpochDay
          .to(endEpochDay, 1)
          .filter(epochDay =>
            weekMask(LocalDate.ofEpochDay(epochDay).getDayOfWeek)
          )

        validDays.map { epochDay =>
          val startDateTime = BsonDateTime(epochDay * 86400000L + startTime)
          val name = expandDatePlaceholders(startDateTime, validData.name)

          DbTask(
            ObjectId(),
            customer._id,
            client,
            validData.project,
            name,
            none[NonEmptyString],
            startDateTime,
            validData.expectedWorkingHours,
            validData.hourlyCost,
            BsonDateTime(System.currentTimeMillis),
            startDateTime
          )
        }.toList
      }
}

object Tasks {
  val collection = Collection[IO, Task.InputData, DbTask]("tasks")

  def labelsStages = Seq(
    Aggregates.lookup(Clients.collection.name, "client", "_id", "c"),
    Aggregates.unwind("$c"),
    Aggregates.lookup(Projects.collection.name, "project", "_id", "p"),
    Aggregates.unwind("$p"),
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
      ),
      Field(
        "project",
        Document(
          "_id" -> "$p._id",
          "name" -> "$p.name"
        )
      )
    )
  )

  def create(
      data: Task.InputData
  )(using
      customer: User
  )(using Lang): EitherT[IO, Error, TaskWithLabels] =
    collection.use { c =>
      for
        projectId <- EitherT
          .fromEither[IO](data.project.toObjectId)
          .leftMap(_ => Error(Status.NotFound, __.ErrorProjectNotFound))
        project <- Projects.findByIdNoStats(projectId)
        data <- EitherT.fromEither[IO](
          Task.fromInputData(data, project.client._id)
        )
        result <- c.create(data)
        task <- findByIdNoStats(result)
        _ <- Projects.collection.use(
          _.update(
            project._id,
            Projects.collection.Update
              .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
              .build
          )
        )
      yield task
    }

  def create(
      data: Task.BatchInputData
  )(using
      customer: User
  )(using Lang): EitherT[IO, Error, Iterable[TaskWithLabels]] = {
    collection.use(c =>
      for {
        projectId <- EitherT
          .fromEither[IO](data.project.toObjectId)
          .leftMap(_ => Error(Status.NotFound, __.ErrorProjectNotFound))
        project <- Projects.findByIdNoStats(projectId)
        inputData <- EitherT.fromEither[IO](
          Task.fromBatchInputData(data, project.client._id)
        )
        ids <- EitherT(
          c
            .raw(_.insertMany(inputData))
            .map(res => res.getInsertedIds)
            .map(ids =>
              if ids.size != inputData.length then
                Left(Error(Status.InternalServerError, __.ErrorUnknown))
              else Right(ids.values.asScala.map(_.asObjectId.getValue))
            )
        )
        tasks <- EitherT.right[Error](
          c.raw(
            _.aggregateWithCodec[TaskWithLabels](
              Seq(
                Aggregates.`match`(Filters.in("_id", ids.asJava))
              ) ++ labelsStages
            ).all
          )
        )
      } yield tasks
    )
  }

  def findByIdNoStats(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, TaskWithLabels] =
    EitherT.fromOptionF(
      collection
        .use(
          _.raw(
            _.aggregateWithCodec[TaskWithLabels](
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
      Error(Status.NotFound, __.ErrorTaskNotFound)
    )

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, TaskWithStats] =
    EitherT.fromOptionF(
      collection
        .use(
          _.raw(
            _.aggregateWithCodec[TaskWithStats](
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
                Aggregates.project(Document("sessions" -> 0))
              )
            ).first.map(
              _.flatMap(task =>
                NonNegativeFloat
                  .decode(task.actualWorkingHours.toFloat / 3600f)
                  .map(actualWorkingHours =>
                    TaskWithStats(
                      task._id,
                      task.name,
                      task.description,
                      task.startTime,
                      task.expectedWorkingHours,
                      task.hourlyCost,
                      task.createdAt,
                      task.updatedAt,
                      task.client,
                      task.project,
                      actualWorkingHours
                    )
                  )
              )
            )
          )
        ),
      Error(Status.NotFound, __.ErrorTaskNotFound)
    )

  def find(query: CursorNoQuery, project: Option[ObjectId])(using
      customer: User
  )(using
      Lang
  ): EitherT[IO, Error, Cursor[TaskWithLabels]] = {
    val matchStage = project.fold(Filters.eq("user", customer._id))(_id =>
      Filters.and(Filters.eq("user", customer._id), Filters.eq("project", _id))
    )

    collection.use(
      _.find[TaskWithLabels](
        "updatedAt",
        Seq(Aggregates.`match`(matchStage)) ++ labelsStages
      )(CursorQuery.fromCursorNoQuery(query))
    )
  }

  def getDue(since: BsonDateTime, to: Option[BsonDateTime])(using
      customer: User
  ): IO[Iterable[TaskWithLabels]] =
    collection.use(
      _.raw(
        _.aggregateWithCodec[TaskWithLabels](
          Seq(
            Aggregates.`match`(
              Filters.and(
                Filters.eq("user", customer._id),
                Filters.gte("startTime", since.toISOString),
                Filters.lt(
                  "startTime",
                  to.getOrElse(BsonDateTime(System.currentTimeMillis))
                    .toISOString
                )
              )
            )
          ) ++ labelsStages
        ).all
      )
    )

  def update(_id: ObjectId, data: Task.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, TaskWithStats] = {
    final case class ProjectData(_id: ObjectId, client: ObjectId)

    for
      task <- findByIdNoStats(_id)
      data <- EitherT.fromEither[IO](Task.validateInputData(data).toResult)
      projectData <-
        if task.project._id == data.project then
          EitherT.rightT[IO, Error](
            ProjectData(task.project._id, task.client._id)
          )
        else
          Projects
            .findByIdNoStats(data.project)
            .map(project => ProjectData(project._id, project.client._id))
      _ <- collection
        .use(
          _.update(
            task._id,
            collection.Update
              .`with`("project" -> projectData._id)
              .`with`("client" -> projectData.client)
              .`with`("name" -> data.name)
              .`with`(
                "description" -> data.description,
                collection.UpdateStrategy.UnsetIfEmpty
              )
              .`with`("startTime" -> data.startTime)
              .`with`("expectedWorkingHours" -> data.expectedWorkingHours)
              .`with`("hourlyCost" -> data.hourlyCost)
              .build
          )
        )
      result <- findById(_id)
      _ <- Projects.collection.use(
        _.update(
          result.project._id,
          Projects.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
    yield result
  }

  def delete(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, TaskWithStats] =
    for
      task <- findById(_id)
      _ <- collection.use(_.delete(task._id))
      _ <- EitherT.right(
        Sessions.collection.use(
          _.raw(_.deleteMany(Filter.eq("task", task._id)))
        )
      )
    yield task
}
