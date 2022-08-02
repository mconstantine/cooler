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
import it.mconst.cooler.models.project.ClientLabel
import it.mconst.cooler.models.project.DbProject
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.task.ProjectLabel
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
    startTime: BsonDateTime
)

final case class SessionWithLabels(
    _id: ObjectId,
    client: ClientLabel,
    project: ProjectLabel,
    task: TaskLabel,
    startTime: BsonDateTime,
    endTime: Option[BsonDateTime],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument

object SessionWithLabels {
  given EntityEncoder[IO, SessionWithLabels] =
    jsonEncoderOf[IO, SessionWithLabels]

  given EntityEncoder[IO, Cursor[SessionWithLabels]] =
    jsonEncoderOf[IO, Cursor[SessionWithLabels]]

  given EntityEncoder[IO, Iterable[SessionWithLabels]] =
    jsonEncoderOf[IO, Iterable[SessionWithLabels]]
}

final case class Session(
    _id: ObjectId,
    val user: ObjectId,
    val client: ObjectId,
    val project: ObjectId,
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

  def fromInputData(
      data: InputData,
      client: ObjectId,
      project: ObjectId,
      task: ObjectId
  )(using customer: User)(using Lang): Either[Error, Session] =
    validateInputData(data).toResult.map(data =>
      Session(
        ObjectId(),
        customer._id,
        client,
        project,
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

  def labelsStages = Seq(
    Aggregates.lookup("clients", "client", "_id", "c"),
    Aggregates.unwind("$c"),
    Aggregates.lookup("projects", "project", "_id", "p"),
    Aggregates.unwind("$p"),
    Aggregates.lookup("tasks", "task", "_id", "t"),
    Aggregates.unwind("$t"),
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
      ),
      Field(
        "project",
        Document(
          "_id" -> "$p._id",
          "name" -> "$p.name"
        )
      ),
      Field(
        "task",
        Document(
          "_id" -> "$t._id",
          "name" -> "$t.name",
          "project" -> "$t.project",
          "startTime" -> "$t.startTime"
        )
      )
    )
    // TODO: $project?
  )

  def findById(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, SessionWithLabels] = EitherT.fromOptionF(
    collection
      .use(
        _.raw(
          _.aggregateWithCodec[SessionWithLabels](
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
    Error(Status.NotFound, __.ErrorSessionNotFound)
  )

  def start(data: Session.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, SessionWithLabels] =
    for
      taskId <- EitherT
        .fromEither[IO](data.task.toObjectId)
        .leftMap(_ => Error(Status.NotFound, __.ErrorTaskNotFound))
      task <- Tasks.findByIdNoStats(taskId)
      data <- EitherT.fromEither(
        Session.fromInputData(
          data,
          task.client._id,
          task.project._id,
          customer._id
        )
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
          session.project._id,
          Projects.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
    yield session

  def getSessions(query: CursorNoQuery, task: ObjectId)(using customer: User)(
      using Lang
  ): EitherT[IO, Error, Cursor[SessionWithLabels]] =
    collection.use(
      _.find[SessionWithLabels](
        "startTime",
        Seq(
          Aggregates.`match`(
            Filters
              .and(Filters.eq("user", customer._id), Filters.eq("task", task))
          )
        ) ++ labelsStages
      )(CursorQuery.fromCursorNoQuery(query))
    )

  def getOpenSessions(using customer: User)(using
      Lang
  ): IO[Iterable[SessionWithLabels]] = collection.use(
    _.raw(
      _.aggregateWithCodec[SessionWithLabels](
        Seq(
          Aggregates.`match`(
            Filters.and(
              Filters.eq("user", customer._id),
              Filters.eq("endTime", null)
            )
          )
        ) ++ labelsStages
      ).all
    )
  )

  def update(_id: ObjectId, data: Session.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, SessionWithLabels] = {
    case class TaskData(_id: ObjectId, client: ObjectId, project: ObjectId)

    for
      session <- findById(_id)
      data <- EitherT.fromEither[IO](Session.validateInputData(data).toResult)
      taskData <-
        if session.task._id == data.task then
          EitherT.rightT[IO, Error](
            TaskData(session.task._id, session.client._id, session.project._id)
          )
        else
          Tasks
            .findByIdNoStats(data.task)
            .map(task => TaskData(task._id, task.client._id, task.project._id))
      _ <- collection
        .use(
          _.update(
            session._id,
            collection.Update
              .`with`("client" -> taskData.client)
              .`with`("project" -> taskData.project)
              .`with`("task" -> taskData._id)
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
      result <- findById(_id)
      _ <- Tasks.collection.use(
        _.update(
          result.task._id,
          Tasks.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
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
  ): EitherT[IO, Error, SessionWithLabels] =
    for
      session <- findById(_id)
      _ <- collection.use(_.delete(session._id))
    yield session
}
