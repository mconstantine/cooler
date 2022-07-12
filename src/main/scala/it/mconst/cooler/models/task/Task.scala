package it.mconst.cooler.models.task

import cats.data.EitherT
import cats.effect.IO
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
import it.mconst.cooler.models.project.DbProject
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.session.Sessions
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

object DbTask {
  given EntityEncoder[IO, DbTask] = jsonEncoderOf[IO, DbTask]
}

final case class ProjectLabel(_id: ObjectId, name: NonEmptyString)

final case class TaskWithProjectLabel(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    startTime: BsonDateTime,
    expectedWorkingHours: PositiveFloat,
    hourlyCost: PositiveFloat,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
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

object TaskWithProjectLabel {
  given EntityEncoder[IO, Iterable[TaskWithProjectLabel]] =
    jsonEncoderOf[IO, Iterable[TaskWithProjectLabel]]

  given EntityEncoder[IO, Cursor[TaskWithProjectLabel]] =
    jsonEncoderOf[IO, Cursor[TaskWithProjectLabel]]
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

  final case class ValidInputData(
      project: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      startTime: BsonDateTime,
      expectedWorkingHours: PositiveFloat,
      hourlyCost: PositiveFloat
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

  def fromInputData(data: InputData)(using Lang): Either[Error, DbTask] =
    validateInputData(data).toResult.map(data =>
      DbTask(
        ObjectId(),
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
}

object Tasks {
  val collection = Collection[IO, Task.InputData, DbTask]("tasks")

  private def findClient(projectId: ObjectId)(using
      customer: User
  )(using Lang): EitherT[IO, Error, Client] =
    Projects.collection.use(c =>
      EitherT.fromOptionF(
        c.raw(
          _.aggregateWithCodec[Client](
            Seq(
              Aggregates.`match`(Filters.eq("_id", projectId)),
              Aggregates.project(Document("_id" -> false, "client" -> 1)),
              Aggregates.lookup(
                Clients.collection.name,
                "client",
                "_id",
                "client"
              ),
              Aggregates.unwind("$client"),
              Aggregates.`match`(Filters.eq("client.user", customer._id)),
              Aggregates.replaceRoot("$client")
            )
          ).first
        ),
        Error(Status.NotFound, __.ErrorClientNotFound)
      )
    )

  def create(
      data: Task.InputData
  )(using customer: User)(using Lang): EitherT[IO, Error, DbTask] =
    collection.use { c =>
      for
        data <- EitherT.fromEither[IO](Task.fromInputData(data))
        _ <- findClient(data.project).leftMap(_ =>
          Error(Status.NotFound, __.ErrorProjectNotFound)
        )
        task <- c.createAndReturn(data)
        _ <- Projects.collection.use(
          _.update(
            task.project,
            Projects.collection.Update
              .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
              .build
          )
        )
      yield task
    }

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, TaskWithStats] =
    EitherT.fromOptionF(
      collection
        .use(
          _.raw(
            _.aggregateWithCodec[TaskWithStats](
              Seq(
                Aggregates.`match`(Filters.eq("_id", _id)),
                Document(
                  "$lookup" -> Document(
                    "from" -> Projects.collection.name,
                    "localField" -> "project",
                    "foreignField" -> "_id",
                    "as" -> "p",
                    "pipeline" -> Seq(
                      Aggregates.lookup(
                        Clients.collection.name,
                        "client",
                        "_id",
                        "client"
                      ),
                      Aggregates.unwind("$client"),
                      Aggregates.`match`(
                        Filters.eq("client.user", customer._id)
                      ),
                      Aggregates.addFields(Field("client", "$client._id"))
                    )
                  )
                ),
                Document(
                  "$match" -> Document(
                    "p" -> Document("$not" -> Document("$size", 0))
                  )
                ),
                Aggregates.unwind("$p"),
                Aggregates.addFields(
                  Field(
                    "project",
                    Document(
                      "_id" -> "$p._id",
                      "name" -> "$p.name"
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
                              "unit" -> "hour"
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
            ).first
          )
        ),
      Error(Status.NotFound, __.ErrorTaskNotFound)
    )

  def find(query: CursorNoQuery, project: Option[ObjectId])(using
      customer: User
  )(using
      Lang
  ): EitherT[IO, Error, Cursor[TaskWithProjectLabel]] = {
    val projectMatch = project.fold(Seq.empty)(_id =>
      Seq(Aggregates.`match`(Filters.eq("_id", _id)))
    )

    val projectsLookupPipeline = projectMatch ++ Seq(
      Document(
        "$lookup" -> Document(
          "from" -> Clients.collection.name,
          "localField" -> "client",
          "foreignField" -> "_id",
          "as" -> "client"
        )
      ),
      Aggregates.`match`(Filters.eq("client.user", customer._id))
    )

    collection.use(
      _.find[TaskWithProjectLabel](
        "updatedAt",
        Seq(
          Document(
            "$lookup" -> Document(
              "from" -> Projects.collection.name,
              "localField" -> "project",
              "foreignField" -> "_id",
              "as" -> "p",
              "pipeline" -> projectsLookupPipeline
            )
          ),
          Document(
            "$match" -> Document(
              "p" -> Document("$not" -> Document("$size", 0))
            )
          ),
          Aggregates.unwind("$p"),
          Aggregates.addFields(
            Field(
              "project",
              Document(
                "_id" -> "$p._id",
                "name" -> "$p.name"
              )
            )
          )
        )
      )(CursorQuery.fromCursorNoQuery(query))
    )
  }

  def getDue(since: BsonDateTime, to: Option[BsonDateTime])(using
      customer: User
  ): IO[Iterable[TaskWithProjectLabel]] =
    collection.use(
      _.raw(
        _.aggregateWithCodec[TaskWithProjectLabel](
          Seq(
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
            Document(
              "$lookup" -> Document(
                "from" -> Projects.collection.name,
                "localField" -> "project",
                "foreignField" -> "_id",
                "as" -> "p",
                "pipeline" -> Seq(
                  Aggregates.lookup(
                    Clients.collection.name,
                    "client",
                    "_id",
                    "client"
                  ),
                  Aggregates.`match`(Filters.eq("client.user", customer._id))
                )
              )
            ),
            Document(
              "$match" -> Document(
                "p" -> Document("$not" -> Document("$size", 0))
              )
            ),
            Aggregates.unwind("$p"),
            Aggregates.addFields(
              Field(
                "project",
                Document(
                  "_id" -> "$p._id",
                  "name" -> "$p.name"
                )
              )
            ),
            Aggregates.project(Document("p" -> 0))
          )
        ).all
      )
    )

  def update(_id: ObjectId, data: Task.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, TaskWithStats] =
    for
      task <- findById(_id)
      data <- EitherT.fromEither[IO](Task.validateInputData(data).toResult)
      projectId <- Projects.findById(data.project).map(_._id)
      _ <- collection
        .use(
          _.update(
            task._id,
            collection.Update
              .`with`("project" -> projectId)
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
      _ <- Projects.collection.use(
        _.update(
          projectId,
          Projects.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
      result <- findById(_id)
    yield result

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
