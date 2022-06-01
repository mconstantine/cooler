package it.mconst.cooler.models

import cats.data.NonEmptyList
import cats.data.Validated
import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.deriveDecoder
import io.circe.generic.auto.deriveEncoder
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Document
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.Result._
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.codecs.MongoCodecProvider
import munit.Assertions
import org.http4s.circe._
import org.http4s.dsl.io._
import org.http4s.EntityEncoder

case class ValidationError(fieldName: String, message: __)(using Lang)
type Validation[T] = Validated[NonEmptyList[ValidationError], T]

extension [T](validation: Validation[T]) {
  def toResult(using Lang): Result[T] = validation.toEither.left.map(error =>
    Error(
      BadRequest,
      __.ErrorDecodeValidationErrors,
      Some(error.groupMapReduce(_.fieldName)(_.message.toString))
    )
  )
}

trait Validator[I, O](using encoder: Encoder[I], decoder: Decoder[I]) {
  def name: String
  def decode(input: I): Option[O]

  def unsafeDecode(input: I)(using a: Assertions): O =
    decode(input).getOrElse(a.fail(s"Invalid $name: '$input'"))

  protected def validate(input: I, error: ValidationError)(using
      Lang
  ): Validation[O] =
    Validated.fromEither(decode(input).toRight(NonEmptyList(error, List.empty)))

  def validate(fieldName: String, input: I)(using Lang): Validation[O]

  def validateOptional(fieldName: String, o: Option[I])(using
      Lang
  ): Validation[Option[O]] =
    o.map(validate(fieldName, _).map(Some(_))).getOrElse(Validated.valid(None))

  given Encoder[O] = encoder.asInstanceOf[Encoder[O]]

  given Decoder[O] =
    decoder.flatMap { i =>
      Decoder.instance(_ =>
        decode(i).toRight(DecodingFailure(name, List.empty))
      )
    }

  given CanEqual[O, I] = CanEqual.derived
}

opaque type NonEmptyString = String

object NonEmptyString extends Validator[String, NonEmptyString] {
  override def name = "NonEmptyString"

  override def decode(s: String): Option[NonEmptyString] =
    Option.unless(s.isEmpty)(s)

  override def validate(fieldName: String, value: String)(using
      Lang
  ): Validation[NonEmptyString] =
    validate(value, ValidationError(fieldName, __.ErrorDecodeEmptyString))
}

opaque type Email = String

object Email extends Validator[String, Email] {
  override def name = "Email"

  private def pattern =
    """^[a-zA-Z0-9\.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$""".r

  override def decode(s: String): Option[Email] = NonEmptyString
    .decode(s)
    .map(_.toString)
    .flatMap(Option.when(pattern.unapplySeq(s).isDefined))

  override def validate(fieldName: String, value: String)(using
      Lang
  ): Validation[Email] =
    validate(
      value,
      ValidationError(fieldName, __.ErrorDecodeInvalidEmailFormat)
    )
}

case class PageInfo(
    totalCount: Int,
    startCursor: Option[String],
    endCursor: Option[String],
    hasPreviousPage: Boolean,
    hasNextPage: Boolean
)

given EntityEncoder[IO, PageInfo] = jsonEncoderOf[IO, PageInfo]

case class Edge[T <: Document](
    node: T,
    cursor: String
)

case class Cursor[T <: Document](pageInfo: PageInfo, edges: List[Edge[T]])

trait CursorQuery(query: Option[String] = None)

case class CursorQueryAsc(
    query: Option[String] = None,
    first: Option[Int] = None,
    after: Option[String] = None
) extends CursorQuery(query)

case class CursorQueryDesc(
    query: Option[String] = None,
    last: Option[Int] = None,
    before: Option[String] = None
) extends CursorQuery(query)
