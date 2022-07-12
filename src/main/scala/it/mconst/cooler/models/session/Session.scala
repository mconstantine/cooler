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

final case class Session(
    _id: ObjectId,
    val task: ObjectId,
    startTime: BsonDateTime,
    endTime: Option[BsonDateTime],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument

object Session {
  given EntityEncoder[IO, Session] = jsonEncoderOf[IO, Session]
  given EntityEncoder[IO, Cursor[Session]] = jsonEncoderOf[IO, Cursor[Session]]

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
      project <- findProject(data.task).leftMap(_ =>
        Error(Status.NotFound, __.ErrorTaskNotFound)
      )
      session <- collection.use(_.createAndReturn(data))
      _ <- Tasks.collection.use(
        _.update(
          session.task,
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

  def stop(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Session] =
    for
      session <- collection.use(_.findOne[Session](Filter.eq("_id", _id)))
      project <- findProject(session.task).leftMap(_ =>
        Error(Status.NotFound, __.ErrorSessionNotFound)
      )
      _ <- collection.use(
        _.update(
          session._id,
          collection.Update
            .`with`(
              "endTime" -> BsonDateTime(System.currentTimeMillis).toISOString
            )
            .build
        )
      )
      _ <- Tasks.collection.use(
        _.update(
          session.task,
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
      result <- collection.use(_.findOne[Session](Filter.eq("_id", _id)))
    yield result

  def getSessions(query: CursorNoQuery, task: ObjectId)(using customer: User)(
      using Lang
  ): EitherT[IO, Error, Cursor[Session]] =
    collection.use(
      _.find[Session](
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
      )(CursorQuery.fromCursorNoQuery(query))
    )

  def update(_id: ObjectId, data: Session.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Session] =
    for
      session <- findById(_id)
      data <- EitherT.fromEither[IO](Session.validateInputData(data).toResult)
      task <- Tasks.findById(data.task)
      _ <- collection
        .use(
          _.update(
            session._id,
            collection.Update
              .`with`("task" -> task._id)
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
          session.task,
          Tasks.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
      _ <- Projects.collection.use(
        _.update(
          task.project._id,
          Projects.collection.Update
            .`with`("updatedAt" -> BsonDateTime(System.currentTimeMillis))
            .build
        )
      )
      result <- findById(_id)
    yield result

  def delete(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Session] =
    for
      session <- findById(_id)
      _ <- collection.use(_.delete(session._id))
    yield session
}
