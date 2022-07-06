package it.mconst.cooler.models.tax

import cats.data.EitherT
import cats.effect.IO
import cats.syntax.apply.*
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.Filters
import com.mongodb.client.result.UpdateResult
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.DbDocument
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import org.http4s.Status

opaque type Percentage = BigDecimal

object Percentage extends Validator[BigDecimal, Percentage] {
  override def name = "Percentage"

  override def decode(n: BigDecimal): Option[Percentage] =
    Option.when(n >= 0 && n <= 1)(n)

  override def validate(fieldName: String, value: BigDecimal)(using
      Lang
  ): Validation[Percentage] =
    validate(
      value,
      ValidationError(fieldName, __.ErrorDecodeInvalidPercentage)
    )
}

extension (p: Percentage) {
  def toBigDecimal: BigDecimal = p
}

final case class Tax(
    _id: ObjectId,
    label: NonEmptyString,
    value: Percentage,
    val user: ObjectId,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument

object Tax {
  given EntityEncoder[IO, Tax] = jsonEncoderOf[IO, Tax]
  given EntityEncoder[IO, Cursor[Tax]] = jsonEncoderOf[IO, Cursor[Tax]]

  final case class InputData(
      label: String,
      value: BigDecimal
  )

  given EntityDecoder[IO, InputData] = jsonOf[IO, InputData]
  given EntityEncoder[IO, InputData] = jsonEncoderOf[IO, InputData]

  final case class ValidInputData(
      label: NonEmptyString,
      value: Percentage
  )

  def validateInputData(data: InputData)(using
      Lang
  ): Validation[ValidInputData] = (
    NonEmptyString.validate("label", data.label),
    Percentage.validate("value", data.value)
  ).mapN((label, value) => ValidInputData(label, value))

  def fromInputData(
      data: InputData
  )(using customer: User)(using Lang): Either[Error, Tax] =
    validateInputData(
      data
    ).toResult.map(data =>
      Tax(
        ObjectId(),
        data.label,
        data.value,
        customer._id,
        BsonDateTime(System.currentTimeMillis),
        BsonDateTime(System.currentTimeMillis)
      )
    )
}

object Taxes {
  val collection = Collection[IO, Tax.InputData, Tax]("taxes")

  def create(data: Tax.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Tax] = collection.use(c =>
    for
      data <- EitherT.fromEither[IO](Tax.fromInputData(data))
      tax <- c.create(data)
    yield tax
  )

  private def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, Tax] =
    collection.use(
      _.findOne[Tax](
        Filter.eq("_id", _id).and(Filter.eq("user", customer._id))
      )
        .leftMap(_ => Error(Status.NotFound, __.ErrorTaxNotFound))
    )

  def find(query: CursorQuery)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Cursor[Tax]] = collection.use(
    _.find[Tax](
      "label",
      Seq(Aggregates.`match`(Filters.eq("user", customer._id)))
    )(query)
  )

  def update(_id: ObjectId, data: Tax.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Tax] =
    for
      tax <- findById(_id)
      update <- EitherT.fromEither[IO](Tax.validateInputData(data).toResult)
      _ <- collection.useWithCodec[BigDecimal, Error, UpdateResult](
        _.update(
          tax._id,
          collection.Update
            .`with`("label" -> update.label)
            .`with`("value" -> update.value)
            .build
        )
      )
      result <- findById(_id)
    yield result

  def delete(_id: ObjectId)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Tax] =
    for
      tax <- findById(_id)
      _ <- collection.use(_.delete(tax._id))
    yield tax
}
