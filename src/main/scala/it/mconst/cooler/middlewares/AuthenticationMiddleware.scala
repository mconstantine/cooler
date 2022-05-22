package it.mconst.cooler.middlewares

import cats._
import cats.data._
import cats.effect._
import cats.implicits._
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.{JWT, User}
import it.mconst.cooler.utils.{__, Error, Translations}
import it.mconst.cooler.utils.Result._
import it.mconst.cooler.utils.given
import org.http4s._
import org.http4s.dsl.io._
import org.http4s.headers._
import org.http4s.server._

object AuthenticationMiddleware {
  private val authUser: Kleisli[IO, Request[IO], Result[User]] =
    Kleisli(request =>
      given Lang = Translations.getLanguageFromHeader(
        request.headers.get[`Accept-Language`]
      )

      request.headers
        .get[Authorization]
        .toRight(Error(Forbidden, __.ErrorInvalidAccessToken))
        .flatMap(_.credentials match
          case Credentials.Token(scheme, token) =>
            Either.cond(
              scheme == AuthScheme.Bearer,
              token,
              Error(Forbidden, __.ErrorInvalidAccessToken)
            )
          case _ => Left(Error(Forbidden, __.ErrorInvalidAccessToken))
        )
        .lift(token => JWT.decodeToken(token, JWT.UserAccess))
    )

  private val onFailure: AuthedRoutes[Error, IO] =
    Kleisli(req => OptionT.liftF(Forbidden(req.context)))

  private val middleware = AuthMiddleware(authUser, onFailure)

  def apply(routes: AuthedRoutes[User, IO]) = middleware(routes)
}
