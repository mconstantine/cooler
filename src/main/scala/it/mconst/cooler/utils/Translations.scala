package it.mconst.cooler.utils

import com.osinka.i18n.Lang
import com.osinka.i18n.Messages
import org.http4s.headers.`Accept-Language`
import org.http4s.LanguageTag

enum __(val key: String):
  case Test extends __("test")
  case ErrorClientNotFound extends __("error.client.notFound")
  case ErrorDecodeEmptyString extends __("error.decode.emptyString")
  case ErrorDecodeInvalidBusinessClientType
      extends __("error.decode.invalidBusinessClientType")
  case ErrorDecodeInvalidClientType extends __("error.decode.invalidClientType")
  case ErrorDecodeInvalidCountryCode
      extends __("error.decode.invalidCountryCode")
  case ErrorDecodeInvalidDateTime extends __("error.decode.invalidDateTime")
  case ErrorDecodeInvalidEmailFormat
      extends __("error.decode.invalidEmailFormat")
  case ErrorDecodeInvalidNonNegative
      extends __("error.decode.invalidNonNegative")
  case ErrorDecodeInvalidObjectId extends __("error.decode.invalidObjectId")
  case ErrorDecodeInvalidPasswordFormat
      extends __("error.decode.invalidPasswordFormat")
  case ErrorDecodeInvalidPercentage extends __("error.decode.invalidPercentage")
  case ErrorDecodeInvalidPositiveFloat
      extends __("error.decode.invalidPasswordFormat")
  case ErrorDecodePositiveInteger
      extends __("error.decode.invalidPositiveInteger")
  case ErrorDecodeInvalidPrivateClientType
      extends __("error.decode.invalidPrivateClientType")
  case ErrorDecodeInvalidProvinceCode
      extends __("error.decode.invalidProvinceCode")
  case ErrorDecodeInvalidQuery extends __("error.decode.invalidQuery")
  case ErrorDecodeValidationErrors extends __("error.decode.validationErrors")
  case ErrorDocumentNotFoundAfterInsert
      extends __("error.document.notFound.afterInsert")
  case ErrorDocumentNotFoundBeforeDelete
      extends __("error.document.notFound.beforeDelete")
  case ErrorDocumentNotFound extends __("error.document.notFound")
  case ErrorInvalidClient extends __("error.invalidClientType")
  case ErrorInvalidAccessToken extends __("error.auth.invalidAccessToken")
  case ErrorInvalidEmailOrPassword
      extends __("error.auth.invalidEmailOrPassword")
  case ErrorProjectNotFound extends __("error.project.notFound")
  case ErrorSessionNotFound extends __("error.session.notFound")
  case ErrorTaskNotFound extends __("error.task.notFound")
  case ErrorTaxNotFound extends __("error.tax.notFound")
  case ErrorUnknown extends __("error.unknown")
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
