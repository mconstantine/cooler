package it.mconst.cooler.models

import cats.data.NonEmptyChain
import cats.data.Validated
import cats.effect.IO
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.deriveDecoder
import io.circe.generic.auto.deriveEncoder
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import mongo4cats.circe.*
import munit.Assertions
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.http4s.EntityEncoder

final case class ValidationError(fieldName: String, message: __)(using Lang)
type Validation[T] = Validated[NonEmptyChain[ValidationError], T]

extension [T](validation: Validation[T]) {
  def toResult(using Lang): Either[Error, T] =
    validation.toEither.left.map(error =>
      Error(
        BadRequest,
        __.ErrorDecodeValidationErrors,
        Some(
          error
            .groupMapReduce(_.fieldName)(_.message.toString)
            .asInstanceOf[Map[String, String]]
        )
      )
    )
}

abstract trait Validator[I, O](using encoder: Encoder[I], decoder: Decoder[I]) {
  def name: String
  def decode(input: I): Option[O]

  def unsafeDecode(input: I)(using a: Assertions): O =
    decode(input).getOrElse(a.fail(s"Invalid $name: '$input'"))

  protected def validate(input: I, error: ValidationError)(using
      Lang
  ): Validation[O] =
    Validated.fromEither(decode(input).toRight(NonEmptyChain.one(error)))

  def validate(fieldName: String, input: I)(using Lang): Validation[O]

  def validateOptional(fieldName: String, o: Option[I])(using
      Lang
  ): Validation[Option[O]] =
    o.map(validate(fieldName, _).map(Some(_)))
      .getOrElse(Validated.valid(none[O]))

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

final case class PageInfo(
    totalCount: Int,
    startCursor: Option[String],
    endCursor: Option[String],
    hasPreviousPage: Boolean,
    hasNextPage: Boolean
)

given EntityEncoder[IO, PageInfo] = jsonEncoderOf[IO, PageInfo]

final case class Edge[T](
    node: T,
    cursor: String
)

final case class Cursor[T](pageInfo: PageInfo, edges: List[Edge[T]])

sealed trait CursorQuery(query: Option[String] = none[String])

object CursorQuery {
  def apply(
      query: Option[String] = none[String],
      first: Option[Int] = none[Int],
      after: Option[String] = none[String],
      last: Option[Int] = none[Int],
      before: Option[String] = none[String]
  )(using Lang): Either[Error, CursorQuery] = {
    val firstOrAfter = first.isDefined || after.isDefined
    val lastOrBefore = last.isDefined || before.isDefined

    if firstOrAfter && lastOrBefore then
      Left(Error(BadRequest, __.ErrorDecodeInvalidQuery))
    else if lastOrBefore then Right(CursorQueryDesc(query, last, before))
    else if firstOrAfter then Right(CursorQueryAsc(query, first, after))
    else Right(CursorQueryAsc(query))
  }
}

final case class CursorQueryAsc(
    query: Option[String] = none[String],
    first: Option[Int] = none[Int],
    after: Option[String] = none[String]
) extends CursorQuery(query)

final case class CursorQueryDesc(
    query: Option[String] = none[String],
    last: Option[Int] = none[Int],
    before: Option[String] = none[String]
) extends CursorQuery(query)
