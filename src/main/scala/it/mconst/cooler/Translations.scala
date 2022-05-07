package it.mconst.cooler

import com.osinka.i18n.{Messages, Lang}

enum Key(val key: String):
  case ErrorPersonNotFoundAfterInsert
      extends Key("error.person.notFound.afterInsert")
  case ErrorPersonNotFoundAfterUpdate
      extends Key("error.person.notFound.afterUpdate")
  case ErrorPersonNotFoundBeforeDelete
      extends Key("error.person.notFound.beforeDelete")

private case class LocalizedString(value: String) {
  override def toString = value
}

object Translations {
  def t(key: Key)(using Lang): LocalizedString = LocalizedString(
    Messages(
      key.key
    )
  )
}
