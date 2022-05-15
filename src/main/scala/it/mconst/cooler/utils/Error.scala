package it.mconst.cooler

import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.{Encoder, Json}
import org.http4s.{EntityEncoder, Status}
import org.http4s.circe._

case class Error(status: Status, messageKey: Key)(using Lang):
  def message = Translations.t(messageKey)

given Encoder[Error] with {
  override def apply(error: Error) = Json.obj(
    ("status", Json.fromInt(error.status.code)),
    ("message", Json.fromString(error.message.toString))
  )
}

given EntityEncoder[IO, Error] = jsonEncoderOf[IO, Error]
