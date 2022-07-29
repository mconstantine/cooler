package it.mconst.cooler.models.session

import cats.data.EitherT
import cats.data.Validated.Valid
import cats.effect.IO
import cats.syntax.all.none
import cats.syntax.apply.*
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.Field
import com.mongodb.client.model.Filters
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.project.DbProject
import it.mconst.cooler.models.project.Projects
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

final case class TaskLabel(
    _id: ObjectId,
    name: NonEmptyString,
    project: ObjectId,
    startTime: BsonDateTime
)

final case class SessionWithTaskLabel(
    _id: ObjectId,
    task: TaskLabel,
    startTime: BsonDateTime,
    endTime: Option[BsonDateTime],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument

object SessionWithTaskLabel {
  given EntityEncoder[IO, SessionWithTaskLabel] =
    jsonEncoderOf[IO, SessionWithTaskLabel]

  given EntityEncoder[IO, Cursor[SessionWithTaskLabel]] =
    jsonEncoderOf[IO, Cursor[SessionWithTaskLabel]]

  given EntityEncoder[IO, Iterable[SessionWithTaskLabel]] =
    jsonEncoderOf[IO, Iterable[SessionWithTaskLabel]]
}

final case class Session(
    _id: ObjectId,
    val task: ObjectId,
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

  private def findProject(taskId: ObjectId)(using
      customer: User
  )(using Lang): EitherT[IO, Error, DbProject] =
    Tasks.collection.use(c =>
      EitherT.fromOptionF(
        c.raw(
          _.aggregateWithCodec[DbProject](
            Seq(
              Aggregates.`match`(Filters.eq("_id", taskId)),
              Aggregates.project(Document("_id" -> false, "project" -> 1)),
              Document(
                "$lookup" -> Document(
                  "from" -> Projects.collection.name,
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
              Aggregates.`match`(
                Filters.eq("project.client.user", customer._id)
              ),
              Aggregates.replaceRoot("$project"),
              Aggregates.addFields(Field("client", "$client._id"))
            )
          ).first
        ),
        Error(Status.NotFound, __.ErrorClientNotFound)
      )
    )

  def findById(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, SessionWithTaskLabel] = EitherT.fromOptionF(
    collection
      .use(
        _.raw(
          _.aggregateWithCodec[SessionWithTaskLabel](
            Seq(
              Aggregates.`match`(Filters.eq("_id", _id)),
              Document(
                "$lookup" -> Document(
                  "from" -> Tasks.collection.name,
                  "localField" -> "task",
                  "foreignField" -> "_id",
                  "as" -> "t",
                  "pipeline" -> Seq(
                    Document(
                      "$lookup" -> Document(
                        "from" -> Projects.collection.name,
                        "localField" -> "project",
                        "foreignField" -> "_id",
                        "as" -> "project",
                        "pipeline" -> Seq(
                          Aggregates.lookup(
                            Clients.collection.name,
                            "client",
                            "_id",
                            "client"
                          ),
                          Aggregates.unwind("$client")
                        )
                      )
                    ),
                    Aggregates.unwind("$project")
                  )
                )
              ),
              Aggregates.unwind("$t"),
              Aggregates.`match`(
                Filters.eq("t.project.client.user", customer._id)
              ),
              Aggregates.addFields(
                Field(
                  "task",
                  Document(
                    "_id" -> "$t._id",
                    "name" -> "$t.name",
                    "project" -> "$t.project._id",
                    "startTime" -> "$t.startTime"
                  )
                )
              )
            )
          ).first
        )
      ),
    Error(Status.NotFound, __.ErrorSessionNotFound)
  )

  def start(data: Session.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, SessionWithTaskLabel] =
    for
      data <- EitherT.fromEither(Session.fromInputData(data))
      project <- findProject(data.task).leftMap(_ =>
        Error(Status.NotFound, __.ErrorTaskNotFound)
      )
      _id <- collection.use(_.create(data))
      session <- findById(_id)
      _ <- Tasks.collection.use(
        _.update(
          session.task._id,
          Tasks.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
      _ <- Projects.collection.use(
        _.update(
          project._id,
          Projects.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
    yield session

  def getSessions(query: CursorNoQuery, task: ObjectId)(using customer: User)(
      using Lang
  ): EitherT[IO, Error, Cursor[SessionWithTaskLabel]] =
    collection.use(
      _.find[SessionWithTaskLabel](
        "startTime",
        Seq(
          Aggregates.`match`(Filters.eq("task", task)),
          Document(
            "$lookup" -> Document(
              "from" -> "tasks",
              "localField" -> "task",
              "foreignField" -> "_id",
              "as" -> "t",
              "pipeline" -> Seq(
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
                Aggregates.unwind("$project")
              )
            )
          ),
          Aggregates.`match`(
            Filters.eq("t.project.client.user", customer._id)
          ),
          Aggregates.unwind("$t"),
          Aggregates.addFields(
            Field(
              "task",
              Document(
                "_id" -> "$t._id",
                "name" -> "$t.name",
                "project" -> "$t.project._id",
                "startTime" -> "$t.startTime"
              )
            )
          )
        )
      )(CursorQuery.fromCursorNoQuery(query))
    )

  def getOpenSessions(using customer: User)(using
      Lang
  ): IO[Iterable[SessionWithTaskLabel]] = collection.use(
    _.raw(
      _.aggregateWithCodec[SessionWithTaskLabel](
        Seq(
          Aggregates.`match`(Filters.eq("endTime", null)),
          Document(
            "$lookup" -> Document(
              "from" -> "tasks",
              "localField" -> "task",
              "foreignField" -> "_id",
              "as" -> "t",
              "pipeline" -> Seq(
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
                Aggregates.unwind("$project")
              )
            )
          ),
          Aggregates.`match`(
            Filters.eq("t.project.client.user", customer._id)
          ),
          Aggregates.unwind("$t"),
          Aggregates.addFields(
            Field(
              "task",
              Document(
                "_id" -> "$t._id",
                "name" -> "$t.name",
                "project" -> "$t.project._id",
                "startTime" -> "$t.startTime"
              )
            )
          )
        )
      ).all
    )
  )

  def update(_id: ObjectId, data: Session.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, SessionWithTaskLabel] =
    for
      session <- findById(_id)
      data <- EitherT.fromEither[IO](Session.validateInputData(data).toResult)
      task <-
        if session.task._id == data.task then
          EitherT.rightT[IO, Error](session.task._id)
        else Tasks.findByIdNoStats(data.task).map(_._id)
      _ <- collection
        .use(
          _.update(
            session._id,
            collection.Update
              .`with`("task" -> task)
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
      _ <- Tasks.collection.use(
        _.update(
          session.task._id,
          Tasks.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
      _ <- Projects.collection.use(
        _.update(
          session.task.project,
          Projects.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
      result <- findById(_id)
    yield result

  def delete(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, SessionWithTaskLabel] =
    for
      session <- findById(_id)
      _ <- collection.use(_.delete(session._id))
    yield session
}
