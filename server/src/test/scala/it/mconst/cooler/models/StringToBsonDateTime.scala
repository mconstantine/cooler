package it.mconst.cooler.models

import cats.data.NonEmptyChain
import cats.data.Validated.Invalid
import cats.data.Validated.Valid
import com.osinka.i18n.Lang
import it.mconst.cooler.utils.__
import org.bson.BsonDateTime

class Conversions extends munit.FunSuite {
  given Lang = Lang.Default

  test("should convert an ISO string to BsonDateTime and back") {
    val validISOString = "1990-09-20T15:30:42.666+02:00"
    val dateTime = validISOString.toBsonDateTime

    assertEquals(dateTime, Right(BsonDateTime(653837442666L)))

    val parsedISOString =
      dateTime.getOrElse(BsonDateTime(System.currentTimeMillis)).toISOString

    assertEquals(parsedISOString, "1990-09-20T13:30:42.666Z")
  }

  test("should handle errors") {
    val invalidISOString = "Last time I showered"
    val result = invalidISOString.toBsonDateTime

    assertEquals(result.left.map(_.getMessage), Left("Invalid ISO 8601 date"))
  }
}
