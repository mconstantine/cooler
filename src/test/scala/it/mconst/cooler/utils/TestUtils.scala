package it.mconst.cooler.utils

import munit.Assertions
import munit.CatsEffectAssertions.MUnitCatsAssertionsForIOOps

import cats.effect.IO
import io.circe.{Encoder, Json}
import io.circe.syntax.EncoderOps
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.Result._
import org.http4s.circe._
import org.http4s.client.Client
import org.http4s.{EntityDecoder, Request}

object TestUtils {
  extension [T](result: IO[Result[T]]) {
    def orFail(using a: Assertions) =
      result.map(_.fold(error => a.fail(error.message.toString), identity))
  }

  extension (request: Request[IO])(using client: Client[IO]) {
    def shouldRespond[A](expected: A)(using Encoder[A]): IO[Unit] = {
      client.expect[Json](request).assertEquals(expected.asJson)
    }

    def shouldRespondLike[A, B](f: A => B, expected: B)(using
        EntityDecoder[IO, A]
    ): IO[Unit] =
      client.expect[A](request).map(f).assertEquals(expected)
  }
}
