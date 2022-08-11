package it.mconst.cooler.routes

import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.*
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.DatabaseName
import it.mconst.cooler.utils.given
import org.http4s.AuthedRoutes
import org.http4s.dsl.io.*

object UserRoutes {
  def routes(using DatabaseName): AuthedRoutes[UserContext, IO] =
    AuthedRoutes.of {
      case ctxReq @ POST -> Root as context => {
        given Lang = context.lang
        given Option[User] = Some(context.user)

        for
          data <- ctxReq.req.as[User.CreationData]
          response <- Users.register(data).toResponse
        yield response
      }

      case ctxReq @ PUT -> Root / "me" as context => {
        given Lang = context.lang
        given User = context.user

        for
          data <- ctxReq.req.as[User.UpdateData]
          response <- Users.update(data).toResponse
        yield response
      }

      case ctxReq @ DELETE -> Root / "me" as context => {
        given Lang = context.lang
        given User = context.user

        Users.delete.toResponse
      }

      case GET -> Root / "me" as context => Ok(context.user)

      case GET -> Root / "stats" :?
          DateTimeMatcher(since) +&
          OptionalDateTimeMatcher(to) as context => {
        given User = context.user
        Ok(Users.getStats(since, to))
      }

      case GET -> Root / "stats" / "avg-cash-per-month" :?
          DateTimeMatcher(since) +&
          OptionalDateTimeMatcher(to) as context => {
        given User = context.user
        Ok.apply(Users.getAvgCashPerMonth(since, to))
      }
    }

  def apply()(using DatabaseName) = UserMiddleware(routes)
}
