package it.mconst.cooler.models

import cats.data.EitherT
import cats.data.NonEmptyChain
import cats.data.OptionT
import cats.effect.IO
import cats.syntax.all.none
import cats.syntax.apply.*
import com.mongodb.client.model.Aggregates
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

final case class ProjectCashData(at: BsonDateTime, amount: BigDecimal)

sealed abstract trait Project(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument {}

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

final case class ProjectWithClient(
    _id: ObjectId,
    name: NonEmptyString,
    description: Option[NonEmptyString],
    cashData: Option[ProjectCashData],
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime,
    client: Client
) extends Project(
      _id,
      name,
      description,
      cashData,
      createdAt,
      updatedAt
    )

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
    data.client.toObjectId("client"),
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
  val collection = Collection[IO, Project.InputData, Project]("projects")

  def create(
      data: Project.InputData
  )(using customer: User)(using Lang): EitherT[IO, Error, Project] =
    collection.use { c =>
      for
        data <- EitherT.fromEither[IO](Project.fromInputData(data))
        _ <- Clients.findById(data.client)
        project <- c.create(data)
      yield project
    }

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, Project] =
    EitherT.fromOptionF(
      collection
        .use(
          _.raw(
            _.aggregateWithCodec[ProjectWithClient](
              Seq(
                Aggregates.`match`(Filters.eq("_id", _id)),
                Aggregates
                  .lookup(Clients.collection.name, "client", "_id", "client"),
                Aggregates.unwind("$client"),
                Aggregates.`match`(Filters.eq("client.user", customer._id))
              )
            ).first
          )
        ),
      Error(Status.NotFound, __.ErrorProjectNotFound)
    )

  def find(query: CursorQuery)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Cursor[Project]] =
    collection.use(
      _.find(
        "name",
        Seq(
          Aggregates
            .lookup(Clients.collection.name, "client", "_id", "tmpClient"),
          Aggregates.unwind("$tmpClient"),
          Aggregates.`match`(Filters.eq("tmpClient.user", customer._id)),
          Aggregates.project(Document("tmpClient" -> false))
        )
      )(query)
    )

  def update(_id: ObjectId, data: Project.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Project] =
    for
      project <- findById(_id)
      data <- EitherT.fromEither[IO](Project.validateInputData(data).toResult)
      client <- Clients.findById(data.client)
      result <- collection
        .useWithCodec[ProjectCashData, Error, Project](
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
    yield result

  def delete(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Project] =
    findById(_id).flatMap(project => collection.use(_.delete(project._id)))
}

given Encoder[Project] with Decoder[Project] with {
  override def apply(project: Project): Json = project match
    case dbProject: DbProject                 => dbProject.asJson
    case projectWithClient: ProjectWithClient => projectWithClient.asJson

  override def apply(c: HCursor): Result[Project] =
    c.as[DbProject].orElse[DecodingFailure, Project](c.as[ProjectWithClient])
}

given EntityEncoder[IO, Project] = jsonEncoderOf[IO, Project]
given EntityDecoder[IO, Project] = jsonOf[IO, Project]
