package it.mconst.cooler

import org.scalatest._
import matchers._
import flatspec._

import cats.effect.IO
import cats.effect.unsafe.implicits.global
import io.circe.generic.auto.{deriveDecoder, deriveEncoder}
import io.circe.Json
import io.circe.syntax.EncoderOps
import it.mconst.cooler.Server._
import org.http4s.circe._
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.io._
import org.http4s.implicits._
import org.http4s.Request
import io.circe.Encoder

extension (request: Request[IO]) {
  def shouldRespond[A](expected: Option[A])(using Encoder[A]): Assertion = {
    import org.scalatest.matchers.should.Matchers.{shouldEqual, shouldBe}

    val client = Client.fromHttpApp(app)

    expected match {
      case Some(a) => {
        val response = client.expect[Json](request).unsafeRunSync()
        response.asJson shouldEqual expected.asJson
      }
      case None => {
        val response = client.expect[String](request).unsafeRunSync()
        response.isEmpty shouldBe true
      }
    }
  }
}

class ServerTest extends AnyFlatSpec with should.Matchers {
  it should "aknowledge the root path" in {
    val request = GET(uri"/api")
    request shouldRespond None
  }

  it should "say hello" in {
    val request = GET(uri"/api/hello/World")
    val expected = Hello("Hello, World")
    request shouldRespond Some(expected)
  }

  it should "say goodbye" in {
    val request = POST(User("Moon man").asJson, uri"/api/goodbye")
    val expected = Goodbye(s"Goodbye Moon man")
    request shouldRespond Some(expected)
  }
}
