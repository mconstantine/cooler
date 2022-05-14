package it.mconst.cooler

import com.osinka.i18n.Lang
import io.circe.{Decoder, Encoder, Json}
import org.http4s.Status

case class Error(status: Status, messageKey: Key)(using Lang):
  def message = Translations.t(messageKey)

given Encoder[Error] = new Encoder[Error] {
  override def apply(error: Error) = Json.obj(
    ("message", Json.fromString(error.message.toString))
  )
}
