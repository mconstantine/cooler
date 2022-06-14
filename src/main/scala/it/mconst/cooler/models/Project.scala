package it.mconst.cooler.models

import cats.data.EitherT
import cats.data.NonEmptyChain
import cats.data.OptionT
import cats.effect.IO
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
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import org.bson.BsonDateTime
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
  final case class CreationData(
      client: String,
      name: String,
      description: Option[String],
      cashData: Option[ProjectCashData]
  )

  final case class ValidCreationData(
      client: ObjectId,
      name: NonEmptyString,
      description: Option[NonEmptyString],
      cashData: Option[ProjectCashData]
  )

  final case class UpdateData(
      client: Option[String],
      name: Option[String],
      description: Option[String],
      cashData: Option[ProjectCashData]
  )

  final case class ValidUpdateData(
      client: Option[ObjectId],
      name: Option[NonEmptyString],
      description: Option[NonEmptyString],
      cashData: Option[ProjectCashData]
  )

  import cats.syntax.apply.*

  def validateCreationData(data: CreationData)(using
      Lang
  ): Validation[ValidCreationData] = (
    data.client.toObjectId("client"),
    NonEmptyString.validate("name", data.name),
    NonEmptyString.validateOptional("description", data.description)
  ).mapN((client, name, description) =>
    ValidCreationData(client, name, description, data.cashData)
  )

  def validateUpdateData(data: UpdateData)(using
      Lang
  ): Validation[ValidUpdateData] = (
    data.client.toOptionalObjectId("client"),
    NonEmptyString.validateOptional("name", data.name),
    NonEmptyString.validateOptional("description", data.description)
  ).mapN((client, name, description) =>
    ValidUpdateData(client, name, description, data.cashData)
  )

  def fromCreationData(data: CreationData)(using
      Lang
  ): Either[Error, DbProject] = validateCreationData(data).toResult.map(data =>
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
  val collectionName = "projects"
  val collection = Collection[IO, Project](collectionName)

  def create(
      data: Project.CreationData
  )(using customer: User)(using Lang): EitherT[IO, Error, Project] =
    collection.use { c =>
      for
        data <- EitherT.fromEither[IO](Project.fromCreationData(data))
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
                  .lookup(Clients.collectionName, "client", "_id", "client"),
                Aggregates.unwind("$client"),
                Aggregates.`match`(Filters.eq("client.user", customer._id))
              )
            ).first
          )
        ),
      Error(Status.NotFound, __.ErrorProjectNotFound)
    )
}

given Encoder[Project] with Decoder[Project] with {
  override def apply(project: Project): Json = project match
    case dbProject: DbProject                 => dbProject.asJson
    case projectWithClient: ProjectWithClient => projectWithClient.asJson

  override def apply(c: HCursor): Result[Project] =
    c.as[DbProject].orElse[DecodingFailure, Project](c.as[ProjectWithClient])
}
