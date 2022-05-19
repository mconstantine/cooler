package it.mconst.cooler.middlewares

import org.scalatest._
import matchers._
import flatspec._

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

class LanguageMiddlewareTest extends AnyFlatSpec with should.Matchers {
  case class Test(message: String)
  given EntityDecoder[IO, Test] = jsonOf[IO, Test]

  val localizedRoutes: LanguageRoutes[IO] = {
    LanguageRoutes.of {
      case GET -> Root as lang =>
        given Lang = lang
        Ok(Translations.t(__.Test).toString)
      case contextRequest @ POST -> Root as lang =>
        given Lang = lang
        for
          body <- contextRequest.req.as[Test]
          response <- Ok(Translations.t(__.Test).toString)
        yield response
    }
  }

  val service: HttpRoutes[IO] = LanguageMiddleware(localizedRoutes)
  val app: HttpApp[IO] = service.orNotFound
  val client = Client.fromHttpApp(app)

  it should "return the default by default" in {
    val request = GET(uri"/")
    val response = app.run(request).unsafeRunSync()

    response.headers.get(ci"Content-Language") shouldBe Some(
      NonEmptyList(Header.Raw(ci"Content-Language", "en"), List.empty)
    )

    val body = response.as[String].unsafeRunSync()
    body should equal("This is a test message")
  }

  it should "return a supported language if available" in {
    val request = GET(uri"/").putHeaders(`Accept-Language`(LanguageTag("it")))
    val response = app.run(request).unsafeRunSync()

    response.headers.get(ci"Content-Language") shouldBe Some(
      NonEmptyList(Header.Raw(ci"Content-Language", "it"), List.empty)
    )

    val body = response.as[String].unsafeRunSync()
    body should equal("Questo è un messaggio di test")
  }
}
