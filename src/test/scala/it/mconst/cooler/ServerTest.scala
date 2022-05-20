package it.mconst.cooler

import munit.CatsEffectSuite

import cats.effect.IO
import org.http4s.client.Client

class ServerTest extends CatsEffectSuite {
  given Client[IO] = Client.fromHttpApp(Server.app)

  // TODO:
  // it should "aknowledge the root path" in {
  //   val request = GET(uri"/api")
  //   request shouldRespond None
  // }

  // it should "say hello" in {
  //   val request = GET(uri"/api/hello/World")
  //   val expected = Server.Hello("Hello, World")
  //   request shouldRespond Some(expected)
  // }

  // it should "say goodbye" in {
  //   val request = POST(Server.User("Moon man").asJson, uri"/api/goodbye")
  //   val expected = Server.Goodbye(s"Goodbye Moon man")
  //   request shouldRespond Some(expected)
  // }
}
