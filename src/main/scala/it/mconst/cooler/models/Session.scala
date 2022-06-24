package it.mconst.cooler.models

import cats.data.EitherT
import cats.effect.IO
import cats.syntax.all.none
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.Filters
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.DbDocument
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import mongo4cats.bson.Document
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import org.http4s.Status
import cats.syntax.apply.*
import cats.data.Validated.Valid
import com.mongodb.client.model.Field

final case class Session(
    _id: ObjectId,
    task: ObjectId,
    startTime: BsonDateTime,
    endTime: Option[BsonDateTime],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument

object Session {
  final case class InputData(
      task: String,
      startTime: Option[String],
      endTime: Option[String]
  )

  given EntityDecoder[IO, InputData] = jsonOf[IO, InputData]
  given EntityEncoder[IO, InputData] = jsonEncoderOf[IO, InputData]

  final case class ValidInputData(
      task: ObjectId,
      startTime: Option[BsonDateTime],
      endTime: Option[BsonDateTime]
  )

  def validateInputData(data: InputData)(using
      Lang
  ): Validation[ValidInputData] = (
    data.task.validateObjectId("task"),
    data.startTime
      .map(_.validateBsonDateTime("startTime").map(Some(_)))
      .getOrElse(Valid(none[BsonDateTime])),
    data.endTime
      .map(_.validateBsonDateTime("endTime").map(Some(_)))
      .getOrElse(Valid(none[BsonDateTime]))
  ).mapN((task, startTime, endTime) => ValidInputData(task, startTime, endTime))

  def fromInputData(data: InputData)(using Lang): Either[Error, Session] =
    validateInputData(data).toResult.map(data =>
      Session(
        ObjectId(),
        data.task,
        data.startTime.getOrElse(BsonDateTime(System.currentTimeMillis)),
        data.endTime,
        BsonDateTime(System.currentTimeMillis),
        BsonDateTime(System.currentTimeMillis)
      )
    )
}

object Sessions {
  val collection = Collection[IO, Session.InputData, Session]("sessions")

  private def findClient(taskId: ObjectId)(using
      customer: User
  )(using Lang): EitherT[IO, Error, Client] = Tasks.collection.use(c =>
    EitherT.fromOptionF(
      c.raw(
        _.aggregateWithCodec[Client](
          Seq(
            Aggregates.`match`(Filters.eq("_id", taskId)),
            Aggregates.project(Document("_id" -> false, "project" -> 1)),
            Document(
              "$lookup" -> Document(
                "from" -> "projects",
                "localField" -> "project",
                "foreignField" -> "_id",
                "as" -> "project",
                "pipeline" -> Seq(
                  Aggregates.lookup("clients", "client", "_id", "client"),
                  Aggregates.unwind("$client")
                )
              )
            ),
            Aggregates.unwind("$project"),
            Aggregates.`match`(Filters.eq("project.client.user", customer._id)),
            Aggregates.replaceRoot("$project.client")
          )
        ).first
      ),
      Error(Status.NotFound, __.ErrorClientNotFound)
    )
  )

  private def findById(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Session] = EitherT.fromOptionF(
    collection
      .use(
        _.raw(
          _.aggregateWithCodec[Session](
            Seq(
              Aggregates.`match`(Filters.eq("_id", _id)),
              Document(
                "$lookup" -> Document(
                  "from" -> "tasks",
                  "localField" -> "task",
                  "foreignField" -> "_id",
                  "as" -> "task",
                  "pipeline" -> Seq(
                    Document(
                      "$lookup" -> Document(
                        "from" -> "projects",
                        "localField" -> "project",
                        "foreignField" -> "_id",
                        "as" -> "project",
                        "pipeline" -> Seq(
                          Aggregates.lookup(
                            "clients",
                            "client",
                            "_id",
                            "client"
                          ),
                          Aggregates.`match`(
                            Filters.eq("client.user", customer._id)
                          )
                        )
                      )
                    )
                  )
                )
              ),
              Document(
                "$match" -> Document(
                  "task.project" -> Document("$not" -> Document("$size", 0))
                )
              ),
              Aggregates.addFields(Field("task", "$task._id")),
              Aggregates.unwind("$task")
            )
          ).first
        )
      ),
    Error(Status.NotFound, __.ErrorSessionNotFound)
  )

  def start(data: Session.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Session] =
    for
      data <- EitherT.fromEither(Session.fromInputData(data))
      _ <- findClient(data.task).leftMap(_ =>
        Error(Status.NotFound, __.ErrorTaskNotFound)
      )
      session <- collection.use(_.create(data))
    yield session

  def stop(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Session] =
    for
      session <- findById(_id)
      result <- collection.use(
        _.update(
          session._id,
          collection.Update
            .`with`(
              "endTime" -> BsonDateTime(System.currentTimeMillis).toISOString
            )
            .build
        )
      )
    yield result

  def getSessions(task: ObjectId, query: CursorQuery)(using customer: User)(
      using Lang
  ): EitherT[IO, Error, Cursor[Session]] = collection.use(
    _.find(
      "startTime",
      Seq(
        Aggregates.`match`(Filters.eq("task", task)),
        Document(
          "$lookup" -> Document(
            "from" -> "tasks",
            "localField" -> "task",
            "foreignField" -> "_id",
            "as" -> "task",
            "pipeline" -> Seq(
              Document(
                "$lookup" -> Document(
                  "from" -> "projects",
                  "localField" -> "project",
                  "foreignField" -> "_id",
                  "as" -> "project",
                  "pipeline" -> Seq(
                    Aggregates.lookup(
                      "clients",
                      "client",
                      "_id",
                      "client"
                    ),
                    Aggregates.`match`(
                      Filters.eq("client.user", customer._id)
                    )
                  )
                )
              )
            )
          )
        ),
        Document(
          "$match" -> Document(
            "task.project" -> Document("$not" -> Document("$size", 0))
          )
        ),
        Aggregates.addFields(Field("task", "$task._id")),
        Aggregates.unwind("$task")
      )
    )(
      query match
        case q: CursorQueryAsc => CursorQueryAsc(none[String], q.first, q.after)
        case q: CursorQueryDesc =>
          CursorQueryDesc(none[String], q.last, q.before)
    )
  )

  def update(_id: ObjectId, data: Session.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Session] =
    for
      session <- findById(_id)
      data <- EitherT.fromEither[IO](Session.validateInputData(data).toResult)
      taskId <- Tasks
        .findById(data.task)
        .flatMap(_ match
          case _: DbTask =>
            EitherT.leftT[IO, ObjectId](
              Error(Status.InternalServerError, __.ErrorUnknown)
            )
          case task: TaskWithProject =>
            EitherT.rightT[IO, Error](task._id)
        )
      result <- collection
        .use(
          _.update(
            session._id,
            collection.Update
              .`with`("task" -> taskId)
              .`with`(
                "startTime" -> data.startTime,
                collection.UpdateStrategy.IgnoreIfEmpty
              )
              .`with`(
                "endTime" -> data.endTime,
                collection.UpdateStrategy.IgnoreIfEmpty
              )
              .build
          )
        )
    yield result

  def delete(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Session] =
    findById(_id).flatMap(session => collection.use(_.delete(session._id)))
}
