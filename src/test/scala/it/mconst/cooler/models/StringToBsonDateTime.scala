package it.mconst.cooler.models

import cats.data.NonEmptyChain
import cats.data.Validated.Invalid
import cats.data.Validated.Valid
import com.osinka.i18n.Lang
import it.mconst.cooler.utils.__
import munit.CatsEffectSuite
import org.bson.BsonDateTime

class StringToBsonDateTime extends CatsEffectSuite {
  given Lang = Lang.Default

  test("should work") {
    val validISOString = "1990-09-20T15:30:42.000Z"
    val dateTime = validISOString.toBsonDateTime("test")

    assertEquals(dateTime.map(_.getValue), Valid(653844642000L))
  }

  test("should handle errors") {
    val validISOString = "Last time I showered"
    val result = validISOString.toBsonDateTime("test")

    assertEquals(
      result,
      Invalid(
        NonEmptyChain.one(
          ValidationError("test", __.ErrorDecodeInvalidDateTime)
        )
      )
    )
  }
}
