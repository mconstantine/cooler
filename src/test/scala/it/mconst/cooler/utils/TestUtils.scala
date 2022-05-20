package it.mconst.cooler.utils

import cats.effect.IO
import it.mconst.cooler.utils.Error
import munit.Assertions

object TestUtils {
  extension [T](result: IO[Either[Error, T]]) {
    def orFail(using a: Assertions) =
      result.map(_.fold(error => a.fail(error.message.toString), identity))
  }
}
