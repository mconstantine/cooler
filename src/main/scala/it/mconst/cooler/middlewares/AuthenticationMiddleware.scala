package it.mconst.cooler.middlewares

import cats._
import cats.data._
import cats.effect._
import cats.implicits._
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.{JWT, User}
import it.mconst.cooler.utils.{__, Error, Translations}
import it.mconst.cooler.utils.given
import org.http4s._
import org.http4s.dsl.io._
import org.http4s.headers._
import org.http4s.server._

object AuthenticationMiddleware {
  private val authUser: Kleisli[IO, Request[IO], Either[Error, User]] =
    Kleisli(request =>
      for
        lang <- IO(
          Translations.getLanguageFromHeader(
            request.headers.get[`Accept-Language`]
          )
        )
        header <- IO({
          given Lang = lang

          request.headers
            .get[Authorization]
            .toRight(Error(Forbidden, __.ErrorInvalidAccessToken))
        })
        token <- IO(header.flatMap { header =>
          given Lang = lang

          val token = header.credentials match
            case Credentials.Token(scheme, token) =>
              if scheme == AuthScheme.Bearer then Some(token) else None
            case _ => None

          token.toRight(
            Error(Forbidden, __.ErrorInvalidAccessToken)
          )
        })
        user <- token match
          case Left(error) => IO(Left(error))
          case Right(token) => {
            given Lang = lang
            JWT.decodeToken(token, JWT.UserAccess)
          }
      yield (user)
    )

  private val onFailure: AuthedRoutes[Error, IO] =
    Kleisli(req => OptionT.liftF(Forbidden(req.context)))

  private val middleware = AuthMiddleware(authUser, onFailure)

  def apply(routes: AuthedRoutes[User, IO]) = middleware(routes)
}
