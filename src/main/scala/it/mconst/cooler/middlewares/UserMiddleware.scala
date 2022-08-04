package it.mconst.cooler.middlewares

import cats.data.EitherT
import cats.data.Kleisli
import cats.data.OptionT
import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Translations
import org.http4s.AuthedRoutes
import org.http4s.AuthScheme
import org.http4s.Credentials
import org.http4s.dsl.io.*
import org.http4s.headers.`Accept-Language`
import org.http4s.headers.Authorization
import org.http4s.Request
import org.http4s.server.AuthMiddleware

object UserMiddleware {
  final case class UserContext(user: User, lang: Lang)

  private val authUser: Kleisli[IO, Request[IO], Either[Error, UserContext]] =
    Kleisli { request =>
      val lang = Translations.getLanguageFromHeader(
        request.headers.get[`Accept-Language`]
      )

      given Lang = lang

      EitherT
        .fromEither[IO](
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
        )
        .flatMap[Error, UserContext](token =>
          JWT
            .decodeToken(token, JWT.UserAccess)
            .map(user => UserContext(user, lang))
        )
        .value
    }

  private val onFailure: AuthedRoutes[Error, IO] =
    Kleisli(req => OptionT.liftF(Forbidden(req.context)))

  private val middleware = AuthMiddleware(authUser, onFailure)

  def apply(routes: AuthedRoutes[UserContext, IO]) = middleware(routes)
}
