package it.mconst.cooler.middlewares

import cats.{Applicative, Monad}
import cats.data.{Kleisli, OptionT}
import cats.effect.IO
import cats.syntax.all._
import com.osinka.i18n.Lang
import it.mconst.cooler.utils.Translations
import org.http4s.{
  ContextRequest,
  ContextRoutes,
  LanguageTag,
  Request,
  Response,
  Status
}
import org.http4s.headers.{`Accept-Language`, `Content-Language`}
import org.http4s.server.ContextMiddleware

type LanguageRequest = ContextRequest[IO, Lang]

type LanguageRoutes =
  Kleisli[[T] =>> OptionT[IO, T], LanguageRequest, Response[IO]]

object LanguageRoutes {
  def apply(
      run: LanguageRequest => OptionT[IO, Response[IO]]
  ): LanguageRoutes =
    Kleisli(req => OptionT(IO.unit >> run(req).value))

  def of(
      pf: PartialFunction[LanguageRequest, IO[Response[IO]]]
  ): LanguageRoutes =
    Kleisli(req => OptionT(IO.unit >> pf.lift(req).sequence))

  def empty: LanguageRoutes = Kleisli.liftF(OptionT.none)
}

object LanguageMiddleware {
  type LanguageMiddleware = ContextMiddleware[IO, Lang]

  private def middleware: LanguageMiddleware = { service =>
    Kleisli { request =>
      val lang = Translations.getLanguageFromHeader(
        request.headers.get[`Accept-Language`]
      )

      val languageRequest: LanguageRequest = ContextRequest(lang, request)

      val response =
        service(languageRequest).getOrElse(Response[IO](Status.NotFound)).map {
          case Status.Successful(response) =>
            response.putHeaders(
              `Content-Language`(LanguageTag(lang.language))
            )
          case response => response
        }

      OptionT.liftF(response)
    }
  }

  def apply(routes: LanguageRoutes) = middleware(routes)
}
