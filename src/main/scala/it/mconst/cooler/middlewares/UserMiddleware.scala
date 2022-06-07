package it.mconst.cooler.middlewares

import cats.*
import cats.data.*
import cats.effect.*
import cats.implicits.*
import com.osinka.i18n.Lang
import it.mconst.cooler.models.user.JWT
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result.*
import it.mconst.cooler.utils.Translations
import org.http4s.*
import org.http4s.dsl.io.*
import org.http4s.headers.*
import org.http4s.server.*

object UserMiddleware {
  final case class UserContext(user: User, lang: Lang)

  private val authUser: Kleisli[IO, Request[IO], Result[UserContext]] =
    Kleisli(request =>
      val lang = Translations.getLanguageFromHeader(
        request.headers.get[`Accept-Language`]
      )

      given Lang = lang

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
        .lift(token =>
          JWT
            .decodeToken(token, JWT.UserAccess)
            .map(_.map(user => UserContext(user, lang)))
        )
    )

  private val onFailure: AuthedRoutes[Error, IO] =
    Kleisli(req => OptionT.liftF(Forbidden(req.context)))

  private val middleware = AuthMiddleware(authUser, onFailure)

  def apply(routes: AuthedRoutes[UserContext, IO]) = middleware(routes)
}
