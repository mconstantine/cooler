package it.mconst.cooler.utils

import com.osinka.i18n.{Messages, Lang}
import org.http4s.headers.`Accept-Language`
import org.http4s.LanguageTag

enum __(val key: String):
  case Test extends __("test")
  case ErrorDecodeEmptyString extends __("error.decode.emptyString")
  case ErrorDecodeInvalidCountryCode
      extends __("error.decode.invalidCountryCode")
  case ErrorDecodeInvalidEmailFormat
      extends __("error.decode.invalidEmailFormat")
  case ErrorDecodeInvalidPasswordFormat
      extends __("error.decode.invalidPasswordFormat")
  case ErrorDecodeInvalidProvinceCode
      extends __("error.decode.invalidProvinceCode")
  case ErrorDecodeValidationErrors extends __("error.decode.validationErrors")
  case ErrorInvalidAccessToken extends __("error.auth.invalidAccessToken")
  case ErrorInvalidEmailOrPassword
      extends __("error.auth.invalidEmailOrPassword")
  case ErrorPersonNotFoundAfterInsert
      extends __("error.person.notFound.afterInsert")
  case ErrorPersonNotFoundAfterUpdate
      extends __("error.person.notFound.afterUpdate")
  case ErrorPersonNotFoundBeforeDelete
      extends __("error.person.notFound.beforeDelete")
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
