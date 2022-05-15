package it.mconst.cooler

import com.osinka.i18n.{Messages, Lang}
import org.http4s.headers.`Accept-Language`
import org.http4s.LanguageTag

enum Key(val key: String):
  case ErrorInvalidAccessToken extends Key("error.auth.invalidAccessToken")
  case ErrorInvalidEmailOrPassword
      extends Key("error.auth.invalidEmailOrPassword")
  case ErrorPersonNotFoundAfterInsert
      extends Key("error.person.notFound.afterInsert")
  case ErrorPersonNotFoundAfterUpdate
      extends Key("error.person.notFound.afterUpdate")
  case ErrorPersonNotFoundBeforeDelete
      extends Key("error.person.notFound.beforeDelete")
  case ErrorUserConflict extends Key("error.user.conflict")
  case ErrorUserNotFound extends Key("error.user.notFound")
  case ErrorUserRegisterForbidden extends Key("error.user.register.forbidden")

object Translations {
  opaque type LocalizedString = String

  private val supportedLangs: List[LanguageTag] =
    List(LanguageTag("en"), LanguageTag("it"))

  def t(key: Key)(using Lang): LocalizedString = Messages(key.key)

  def getLanguageFromHeader(header: Option[`Accept-Language`]): Lang = {
    Lang(
      supportedLangs
        .find(_.matches(header.map(_.values.head).getOrElse(LanguageTag("en"))))
        .getOrElse(supportedLangs.head)
        .primaryTag
    )
  }
}
