package it.mconst.cooler.middlewares

import org.scalatest._
import matchers._
import flatspec._

import cats.data.NonEmptyList
import cats.effect.IO
import cats.effect.unsafe.implicits.global
import com.osinka.i18n.Lang
import org.http4s._
import org.http4s.client.Client
import org.http4s.client.dsl.io._
import org.http4s.dsl.io._
import org.http4s.headers.{`Accept-Language`}
import org.http4s.implicits._
import org.typelevel.ci._

class LanguageMiddlewareTest extends AnyFlatSpec with should.Matchers {
  val localizedRoutes: LanguageRoutes = LanguageRoutes.of {
    case GET -> Root as language =>
      Ok("Localized")
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

    body should equal("Localized")
  }

  it should "return a supported language if available" in {
    val request = GET(uri"/").putHeaders(`Accept-Language`(LanguageTag("it")))
    val response = app.run(request).unsafeRunSync()

    response.headers.get(ci"Content-Language") shouldBe Some(
      NonEmptyList(Header.Raw(ci"Content-Language", "it"), List.empty)
    )
  }
}
