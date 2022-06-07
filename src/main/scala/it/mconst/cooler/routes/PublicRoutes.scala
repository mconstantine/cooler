package it.mconst.cooler.routes

import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.LanguageMiddleware
import it.mconst.cooler.middlewares.LanguageRoutes
import it.mconst.cooler.models.user.given
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result.*
import org.http4s.dsl.io.*

object PublicRoutes {
  val routes: LanguageRoutes[IO] = {
    LanguageRoutes.of {
      case ctxReq @ POST -> Root / "register" as lang => {
        given Lang = lang
        given Option[User] = None

        for
          data <- ctxReq.req.as[User.CreationData]
          response <- Users.register(data).flatMap(_.toResponse)
        yield response
      }
      case ctxReq @ POST -> Root / "login" as lang => {
        given Lang = lang

        for
          data <- ctxReq.req.as[User.LoginData]
          response <- Users.login(data).flatMap(_.toResponse)
        yield response
      }
      case ctxReq @ POST -> Root / "refresh-token" as lang => {
        given Lang = lang

        for
          data <- ctxReq.req.as[User.RefreshTokenData]
          response <- Users.refreshToken(data).flatMap(_.toResponse)
        yield response
      }
    }
  }

  def apply() = LanguageMiddleware(routes)
}
