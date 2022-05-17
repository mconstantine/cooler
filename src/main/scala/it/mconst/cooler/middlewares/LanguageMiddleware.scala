package it.mconst.cooler.middlewares

import cats.{Applicative, Functor, Monad}
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

type LanguageRequest[F[_]] = ContextRequest[F, Lang]

type LanguageRoutes[F[_]] =
  Kleisli[[T] =>> OptionT[F, T], LanguageRequest[F], Response[F]]

object LanguageRoutes {
  def apply[F[_]](
      run: LanguageRequest[F] => OptionT[F, Response[F]]
  )(using F: Monad[F]): LanguageRoutes[F] =
    Kleisli(req => OptionT(F.unit >> run(req).value))

  def of[F[_]](
      pf: PartialFunction[LanguageRequest[F], F[Response[F]]]
  )(using FA: Monad[F]): LanguageRoutes[F] =
    Kleisli(req => OptionT(FA.unit >> pf.lift(req).sequence))

  def empty[F[_]: Applicative]: LanguageRoutes[F] = Kleisli.liftF(OptionT.none)
}

object LanguageMiddleware {
  type LanguageMiddleware[F[_]] = ContextMiddleware[F, Lang]

  private def middleware[F[_]: Functor]: LanguageMiddleware[F] = { service =>
    Kleisli { request =>
      val lang = Translations.getLanguageFromHeader(
        request.headers.get[`Accept-Language`]
      )

      val languageRequest: LanguageRequest[F] = ContextRequest(lang, request)

      val response =
        service(languageRequest).getOrElse(Response[F](Status.NotFound)).map {
          case Status.Successful(response) =>
            response.putHeaders(
              `Content-Language`(LanguageTag(lang.language))
            )
          case response => response
        }

      OptionT.liftF(response)
    }
  }

  def apply(routes: LanguageRoutes[IO]) = middleware.apply(routes)
}
