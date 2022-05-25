package it.mconst.cooler.utils

import com.osinka.i18n.{Messages, Lang}
import org.http4s.headers.`Accept-Language`
import org.http4s.LanguageTag

enum __(val key: String):
  case Test extends __("test")
  case ErrorClientNotFound extends __("error.client.notFound")
  case ErrorDecodeEmptyString extends __("error.decode.emptyString")
  case ErrorDecodeInvalidCountryCode
      extends __("error.decode.invalidCountryCode")
  case ErrorDecodeInvalidEmailFormat
      extends __("error.decode.invalidEmailFormat")
  case ErrorDecodeInvalidObjectId extends __("error.decode.invalidObjectId")
  case ErrorDecodeInvalidPasswordFormat
      extends __("error.decode.invalidPasswordFormat")
  case ErrorDecodeInvalidProvinceCode
      extends __("error.decode.invalidProvinceCode")
  case ErrorDecodeValidationErrors extends __("error.decode.validationErrors")
  case ErrorDocumentNotFoundAfterInsert
      extends __("error.document.notFound.afterInsert")
  case ErrorDocumentNotFoundAfterUpdate
      extends __("error.document.notFound.afterUpdate")
  case ErrorDocumentNotFoundBeforeDelete
      extends __("error.document.notFound.beforeDelete")
  case ErrorInvalidAccessToken extends __("error.auth.invalidAccessToken")
  case ErrorInvalidEmailOrPassword
      extends __("error.auth.invalidEmailOrPassword")
  case ErrorUserConflict extends __("error.user.conflict")
  case ErrorUserNotFound extends __("error.user.notFound")
  case ErrorUserRegisterForbidden extends __("error.user.register.forbidden")

object Translations {
  opaque type LocalizedString = String

  private val supportedLangs: List[LanguageTag] =
    List(LanguageTag("en"), LanguageTag("it"))

  def t(key: __)(using Lang): LocalizedString = Messages(key.key)

  def getLanguageFromHeader(header: Option[`Accept-Language`]): Lang = {
    Lang(
      supportedLangs
        .find(_.matches(header.map(_.values.head).getOrElse(LanguageTag("en"))))
        .getOrElse(supportedLangs.head)
        .primaryTag
    )
  }
}
