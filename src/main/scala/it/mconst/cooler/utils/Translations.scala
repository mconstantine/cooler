package it.mconst.cooler.utils

import com.osinka.i18n.Lang
import com.osinka.i18n.Messages
import java.time.DayOfWeek
import java.time.Month
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
  case ErrorDecodeInvalidWeekdayBitMask
      extends __("error.decode.invalidWeekdayBitMask")
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
  case MonthNameLongJanuary extends __("month.long.January")
  case MonthNameLongFebruary extends __("month.long.February")
  case MonthNameLongMarch extends __("month.long.March")
  case MonthNameLongApril extends __("month.long.April")
  case MonthNameLongMay extends __("month.long.May")
  case MonthNameLongJune extends __("month.long.June")
  case MonthNameLongJuly extends __("month.long.July")
  case MonthNameLongAugust extends __("month.long.August")
  case MonthNameLongSeptember extends __("month.long.September")
  case MonthNameLongOctober extends __("month.long.October")
  case MonthNameLongNovember extends __("month.long.November")
  case MonthNameLongDecember extends __("month.long.December")
  case MonthNameShortJanuary extends __("month.short.January")
  case MonthNameShortFebruary extends __("month.short.February")
  case MonthNameShortMarch extends __("month.short.March")
  case MonthNameShortApril extends __("month.short.April")
  case MonthNameShortMay extends __("month.short.May")
  case MonthNameShortJune extends __("month.short.June")
  case MonthNameShortJuly extends __("month.short.July")
  case MonthNameShortAugust extends __("month.short.August")
  case MonthNameShortSeptember extends __("month.short.September")
  case MonthNameShortOctober extends __("month.short.October")
  case MonthNameShortNovember extends __("month.short.November")
  case MonthNameShortDecember extends __("month.short.December")
  case WeekdayNameLongMonday extends __("weekday.long.Monday")
  case WeekdayNameLongTuesday extends __("weekday.long.Tuesday")
  case WeekdayNameLongWednesday extends __("weekday.long.Wednesday")
  case WeekdayNameLongThursday extends __("weekday.long.Thursday")
  case WeekdayNameLongFriday extends __("weekday.long.Friday")
  case WeekdayNameLongSaturday extends __("weekday.long.Saturday")
  case WeekdayNameLongSunday extends __("weekday.long.Sunday")
  case WeekdayNameShortMonday extends __("weekday.short.Monday")
  case WeekdayNameShortTuesday extends __("weekday.short.Tuesday")
  case WeekdayNameShortWednesday extends __("weekday.short.Wednesday")
  case WeekdayNameShortThursday extends __("weekday.short.Thursday")
  case WeekdayNameShortFriday extends __("weekday.short.Friday")
  case WeekdayNameShortSaturday extends __("weekday.short.Saturday")
  case WeekdayNameShortSunday extends __("weekday.short.Sunday")

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

  def getMonthsLongNames(using Lang): Map[Month, LocalizedString] = Map(
    Month.JANUARY -> t(__.MonthNameLongJanuary),
    Month.FEBRUARY -> t(__.MonthNameLongFebruary),
    Month.MARCH -> t(__.MonthNameLongMarch),
    Month.APRIL -> t(__.MonthNameLongApril),
    Month.MAY -> t(__.MonthNameLongMay),
    Month.JUNE -> t(__.MonthNameLongJune),
    Month.JULY -> t(__.MonthNameLongJuly),
    Month.AUGUST -> t(__.MonthNameLongAugust),
    Month.SEPTEMBER -> t(__.MonthNameLongSeptember),
    Month.OCTOBER -> t(__.MonthNameLongOctober),
    Month.NOVEMBER -> t(__.MonthNameLongNovember),
    Month.DECEMBER -> t(__.MonthNameLongDecember)
  )

  def getMonthsShortNames(using Lang): Map[Month, LocalizedString] = Map(
    Month.JANUARY -> t(__.MonthNameShortJanuary),
    Month.FEBRUARY -> t(__.MonthNameShortFebruary),
    Month.MARCH -> t(__.MonthNameShortMarch),
    Month.APRIL -> t(__.MonthNameShortApril),
    Month.MAY -> t(__.MonthNameShortMay),
    Month.JUNE -> t(__.MonthNameShortJune),
    Month.JULY -> t(__.MonthNameShortJuly),
    Month.AUGUST -> t(__.MonthNameShortAugust),
    Month.SEPTEMBER -> t(__.MonthNameShortSeptember),
    Month.OCTOBER -> t(__.MonthNameShortOctober),
    Month.NOVEMBER -> t(__.MonthNameShortNovember),
    Month.DECEMBER -> t(__.MonthNameShortDecember)
  )

  def getWeekdaysLongNames(using Lang): Map[DayOfWeek, LocalizedString] = Map(
    DayOfWeek.MONDAY -> t(__.WeekdayNameLongMonday),
    DayOfWeek.TUESDAY -> t(__.WeekdayNameLongTuesday),
    DayOfWeek.WEDNESDAY -> t(__.WeekdayNameLongWednesday),
    DayOfWeek.THURSDAY -> t(__.WeekdayNameLongThursday),
    DayOfWeek.FRIDAY -> t(__.WeekdayNameLongFriday),
    DayOfWeek.SATURDAY -> t(__.WeekdayNameLongSaturday),
    DayOfWeek.SUNDAY -> t(__.WeekdayNameLongSunday)
  )

  def getWeekdaysShortNames(using Lang): Map[DayOfWeek, LocalizedString] = Map(
    DayOfWeek.MONDAY -> t(__.WeekdayNameShortMonday),
    DayOfWeek.TUESDAY -> t(__.WeekdayNameShortTuesday),
    DayOfWeek.WEDNESDAY -> t(__.WeekdayNameShortWednesday),
    DayOfWeek.THURSDAY -> t(__.WeekdayNameShortThursday),
    DayOfWeek.FRIDAY -> t(__.WeekdayNameShortFriday),
    DayOfWeek.SATURDAY -> t(__.WeekdayNameShortSaturday),
    DayOfWeek.SUNDAY -> t(__.WeekdayNameShortSunday)
  )
}
