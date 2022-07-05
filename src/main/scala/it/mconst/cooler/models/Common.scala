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
import java.nio.charset.MalformedInputException
import java.time.format.DateTimeFormatter
import java.time.LocalDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.http4s.EntityEncoder
import org.http4s.Status
import scala.util.Try

final case class ValidationError(fieldName: String, message: __)(using Lang) {
  def toError: Error = Error(Status.BadRequest, this.message)
}

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

  def unsafe(i: I): O = decode(i).get

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

opaque type PositiveInteger = Int

object PositiveInteger extends Validator[Int, PositiveInteger] {
  override def name = "PositiveInteger"

  override def decode(n: Int): Option[PositiveInteger] = Option.when(n > 0)(n)

  override def validate(fieldName: String, value: Int)(using
      Lang
  ): Validation[PositiveInteger] =
    validate(value, ValidationError(fieldName, __.ErrorDecodePositiveInteger))
}

extension (pi: PositiveInteger) {
  def toInt: Int = pi
}

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

  extension (pf: PositiveFloat) {
    def toFloat: Float = pf
  }
}

opaque type NonNegativeFloat = Float

object NonNegativeFloat extends Validator[Float, NonNegativeFloat] {
  override def name = "NonNegativeFloat"

  override def decode(n: Float): Option[NonNegativeFloat] =
    Option.when(n >= 0)(n)

  override def validate(fieldName: String, value: Float)(using
      Lang
  ): Validation[NonNegativeFloat] =
    validate(
      value,
      ValidationError(fieldName, __.ErrorDecodeInvalidNonNegative)
    )

  extension (pf: NonNegativeFloat) {
    def toFloat: Float = pf
  }
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

object Cursor {
  def empty[T]: Cursor[T] =
    Cursor(PageInfo(0, none[String], none[String], false, false), List.empty)
}

sealed trait CursorQuery(query: Option[String] = none[String])

object CursorQuery {
  def apply(
      query: Option[String] = none[String],
      first: Option[Int] = none[Int],
      after: Option[String] = none[String],
      last: Option[Int] = none[Int],
      before: Option[String] = none[String]
  )(using Lang): Either[Error, CursorQuery] = {
    val validatedFirst =
      first.map(PositiveInteger.validate("first", _).leftMap(_.head))

    val validatedLast =
      last.map(PositiveInteger.validate("last", _).leftMap(_.head))

    val firstOrAfter = validatedFirst.isDefined || after.isDefined
    val lastOrBefore = validatedLast.isDefined || before.isDefined

    if firstOrAfter && lastOrBefore then
      Left(Error(BadRequest, __.ErrorDecodeInvalidQuery))
    else if lastOrBefore then
      validatedLast
        .map(
          _.toEither
            .map(last => CursorQueryDesc(query, Some(last), before))
            .left
            .map(_.toError)
        )
        .getOrElse(Right(CursorQueryDesc(query, none[PositiveInteger], before)))
    else if firstOrAfter then
      validatedFirst
        .map(
          _.toEither
            .map(first => CursorQueryAsc(query, Some(first), after))
            .left
            .map(_.toError)
        )
        .getOrElse(Right(CursorQueryAsc(query, none[PositiveInteger], after)))
    else Right(CursorQueryAsc(query))
  }

  def empty = CursorQueryAsc(none[String], none[PositiveInteger], none[String])
}

final case class CursorQueryAsc(
    query: Option[String] = none[String],
    first: Option[PositiveInteger] = none[PositiveInteger],
    after: Option[String] = none[String]
) extends CursorQuery(query)

final case class CursorQueryDesc(
    query: Option[String] = none[String],
    last: Option[PositiveInteger] = none[PositiveInteger],
    before: Option[String] = none[String]
) extends CursorQuery(query)

extension (s: String) {
  def toObjectId: Either[String, ObjectId] = ObjectId.from(s)

  def validateObjectId(fieldName: String)(using Lang): Validation[ObjectId] =
    Validated.fromEither(
      s.toObjectId.left
        .map(_ =>
          NonEmptyChain.one(
            ValidationError(fieldName, __.ErrorDecodeInvalidObjectId)
          )
        )
    )

  def toBsonDateTime: Either[Throwable, BsonDateTime] = {
    val regex =
      "^(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2}).(\\d{3})((?:Z|[+-]\\d{2}:\\d{2}))$".r

    val matcher = regex.pattern.matcher(s)

    if matcher.matches then
      Try {
        BsonDateTime(
          LocalDateTime
            .of(
              matcher.group(1).toInt,
              matcher.group(2).toInt,
              matcher.group(3).toInt,
              matcher.group(4).toInt,
              matcher.group(5).toInt,
              matcher.group(6).toInt
            )
            .atZone(ZoneId.of(matcher.group(8)))
            .toEpochSecond * 1000L + matcher.group(7).toLong
        )
      }.toEither
    else Left(new IllegalArgumentException("Invalid ISO 8601 date"))
  }

  def validateBsonDateTime(
      fieldName: String
  )(using Lang): Validation[BsonDateTime] = {
    Validated.fromEither(
      s.toBsonDateTime.left
        .map(_ =>
          NonEmptyChain.one(
            ValidationError(fieldName, __.ErrorDecodeInvalidDateTime)
          )
        )
    )
  }
}

extension (bdt: BsonDateTime) {
  def toISOString: String = {
    val timestamp = bdt.getValue
    val millis = (timestamp % 1000).toInt

    val millisString =
      if millis < 10 then s"00$millis"
      else if millis < 100 then s"0$millis"
      else millis.toString

    LocalDateTime
      .ofEpochSecond(timestamp / 1000, 0, ZoneOffset.UTC)
      .format(DateTimeFormatter.ISO_DATE_TIME) + s".${millisString}Z"
  }
}

extension (os: Option[String]) {
  def toOptionalObjectId(fieldName: String)(using
      Lang
  ): Validation[Option[ObjectId]] =
    os.map(_.validateObjectId(fieldName).map(Some(_)))
      .getOrElse(Validated.valid(none[ObjectId]))
}
