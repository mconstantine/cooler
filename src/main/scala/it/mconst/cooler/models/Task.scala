package it.mconst.cooler.models

import cats.data.EitherT
import cats.effect.IO
import cats.syntax.apply.*
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.Decoder.Result
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.*
import io.circe.HCursor
import io.circe.Json
import io.circe.syntax.*
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.DbDocument
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import org.http4s.Status
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.Filters
import mongo4cats.bson.Document
import com.mongodb.client.model.Field

opaque type PositiveFloat = Float

object PositiveFloat extends Validator[Float, PositiveFloat] {
  override def name = "PositiveFloat"

  override def decode(n: Float): Option[PositiveFloat] = Option.when(n > 0)(n)

  override def validate(fieldName: String, value: Float)(using
      Lang
  ): Validation[PositiveFloat] =
    validate(
      value,
      ValidationError(fieldName, __.ErrorDecodeInvalidPositiveFloat)
    )
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

final case class TaskWithProject(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    startTime: BsonDateTime,
    expectedWorkingHours: PositiveFloat,
    hourlyCost: PositiveFloat,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
    project: DbProject
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
    data.project.toObjectId("project"),
    NonEmptyString.validate("name", data.name),
    NonEmptyString.validateOptional("description", data.description),
    data.startTime.toBsonDateTime("startTime"),
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
  val collection = Collection[IO, Task.InputData, Task]("tasks")

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
              Aggregates.lookup("clients", "client", "_id", "client"),
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
  )(using customer: User)(using Lang): EitherT[IO, Error, Task] =
    collection.use { c =>
      for
        data <- EitherT.fromEither[IO](Task.fromInputData(data))
        _ <- findClient(data.project).leftMap(_ =>
          Error(Status.NotFound, __.ErrorProjectNotFound)
        )
        task <- c.create(data)
      yield task
    }

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, Task] =
    EitherT.fromOptionF(
      collection
        .use(
          _.raw(
            _.aggregateWithCodec[TaskWithProject](
              Seq(
                Aggregates.`match`(Filters.eq("_id", _id)),
                Document(
                  "$lookup" -> Document(
                    "from" -> "projects",
                    "localField" -> "project",
                    "foreignField" -> "_id",
                    "as" -> "project",
                    "pipeline" -> Seq(
                      Aggregates.lookup("clients", "client", "_id", "client"),
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
                    "project" -> Document("$not" -> Document("$size", 0))
                  )
                ),
                Aggregates.unwind("$project")
              )
            ).first
          )
        ),
      Error(Status.NotFound, __.ErrorTaskNotFound)
    )

  def find(query: CursorQuery)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Cursor[Task]] =
    collection.use(
      _.find(
        "name",
        Seq(
          Document(
            "$lookup" -> Document(
              "from" -> "projects",
              "localField" -> "project",
              "foreignField" -> "_id",
              "as" -> "project",
              "pipeline" -> Seq(
                Document(
                  "$lookup" -> Document(
                    "from" -> "clients",
                    "localField" -> "client",
                    "foreignField" -> "_id",
                    "as" -> "client"
                  )
                ),
                Document(
                  "$match" -> Document(
                    "client.user" -> customer._id
                  )
                )
              )
            )
          ),
          Document(
            "$match" -> Document(
              "project" -> Document("$not" -> Document("$size", 0))
            )
          ),
          Aggregates.unwind("$project"),
          Aggregates.addFields(Field("project", "$project._id"))
        )
      )(query)
    )

  // def update(_id: ObjectId, data: Project.InputData)(using customer: User)(using
  //     Lang
  // ): EitherT[IO, Error, Project] =
  //   for
  //     project <- findById(_id)
  //     data <- EitherT.fromEither[IO](Project.validateInputData(data).toResult)
  //     client <- Clients.findById(data.client)
  //     result <- collection
  //       .useWithCodec[ProjectCashData, Error, Project](
  //         _.update(
  //           project._id,
  //           collection.Update
  //             .`with`("client" -> client._id)
  //             .`with`("name" -> data.name)
  //             .`with`(
  //               "description" -> data.description,
  //               collection.UpdateStrategy.UnsetIfEmpty
  //             )
  //             .`with`(
  //               "cashData" -> data.cashData,
  //               collection.UpdateStrategy.UnsetIfEmpty
  //             )
  //             .build
  //         )
  //       )
  //   yield result

  // def delete(_id: ObjectId)(using customer: User)(using
  //     Lang
  // ): EitherT[IO, Error, Project] =
  //   findById(_id).flatMap(project => collection.use(_.delete(project._id)))
}

given Encoder[Task] with Decoder[Task] with {
  override def apply(task: Task): Json = task match
    case dbTask: DbTask                   => dbTask.asJson
    case taskWithProject: TaskWithProject => taskWithProject.asJson

  override def apply(c: HCursor): Result[Task] =
    c.as[DbTask].orElse[DecodingFailure, Task](c.as[TaskWithProject])
}

given EntityEncoder[IO, Task] = jsonEncoderOf[IO, Task]
given EntityDecoder[IO, Task] = jsonOf[IO, Task]
