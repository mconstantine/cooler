package it.mconst.cooler.utils

import com.osinka.i18n.{Messages, Lang}
import org.http4s.headers.`Accept-Language`
import org.http4s.LanguageTag

enum __(val key: String):
  case Test extends __("test")
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
  case ErrorUserRegisterEmptyName extends __("error.user.register.emptyName")
  case ErrorUserRegisterForbidden extends __("error.user.register.forbidden")
  case ErrorUserRegisterInvalidEmailFormat
      extends __("error.user.register.invalidEmailFormat")
  case ErrorUserRegisterInvalidPasswordFormat
      extends __("error.user.register.invalidPasswordFormat")

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
