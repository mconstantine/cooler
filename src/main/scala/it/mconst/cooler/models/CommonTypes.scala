package it.mconst.cooler.models

import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.Result._
import munit.Assertions
import org.http4s.dsl.io._
import cats.data.Validated
import cats.data.NonEmptyList

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
