package it.mconst.cooler.middlewares

import munit.CatsEffectSuite

import cats.data.NonEmptyList
import cats.effect.IO
import cats.effect.unsafe.implicits.global
import com.osinka.i18n.Lang
import io.circe.generic.auto._
import it.mconst.cooler.utils.{__, Translations}
import org.http4s._
import org.http4s.circe._
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.io._
import org.http4s.headers.{`Accept-Language`}
import org.http4s.implicits._
import org.typelevel.ci._

class LanguageMiddlewareTest extends CatsEffectSuite {
  case class TestData(message: String)
  given EntityDecoder[IO, TestData] = jsonOf[IO, TestData]

  val localizedRoutes: LanguageRoutes[IO] = {
    LanguageRoutes.of {
      case GET -> Root as lang =>
        given Lang = lang
        Ok(Translations.t(__.Test).toString)
      case contextRequest @ POST -> Root as lang =>
        given Lang = lang
        for
          body <- contextRequest.req.as[TestData]
          response <- Ok(Translations.t(__.Test).toString)
        yield response
    }
  }

  val service: HttpRoutes[IO] = LanguageMiddleware(localizedRoutes)
  val app: HttpApp[IO] = service.orNotFound
  val client = Client.fromHttpApp(app)

  test("should return the default by default") {
    for
      response <- app.run(GET(uri"/"))
      language = response.headers.get(ci"Content-Language")
      body <- response.as[String].assertEquals("This is a test message")
      _ <- IO(language).assertEquals(
        Some(NonEmptyList(Header.Raw(ci"Content-Language", "en"), List.empty))
      )
    yield ()
  }

  test("should return a supported language if available") {
    val request = GET(uri"/").putHeaders(`Accept-Language`(LanguageTag("it")))

    for
      response <- app.run(request)
      _ <- IO(response.headers.get(ci"Content-Language")).assertEquals(
        Some(NonEmptyList(Header.Raw(ci"Content-Language", "it"), List.empty))
      )
      _ <- response.as[String].assertEquals("Questo è un messaggio di test")
    yield ()
  }
}
