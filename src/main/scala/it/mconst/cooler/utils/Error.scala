package it.mconst.cooler.utils

import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.Encoder
import io.circe.Json
import it.mconst.cooler.utils.Translations
import org.http4s.circe.*
import org.http4s.EntityEncoder
import org.http4s.Status

case class Error(
    status: Status,
    messageKey: __,
    extras: Option[Map[String, String]] = None
)(using Lang) {
  def message = Translations.t(messageKey)
}

given Encoder[Error] with {
  override def apply(error: Error) = Json.obj(
    ("status", Json.fromInt(error.status.code)),
    ("message", Json.fromString(error.message.toString))
  )
}

given EntityEncoder[IO, Error] = jsonEncoderOf[IO, Error]
