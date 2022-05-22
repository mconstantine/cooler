package it.mconst.cooler.utils

import cats.effect.IO
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.Result._
import munit.Assertions

object TestUtils {
  extension [T](result: IO[Result[T]]) {
    def orFail(using a: Assertions) =
      result.map(_.fold(error => a.fail(error.message.toString), identity))
  }
}
