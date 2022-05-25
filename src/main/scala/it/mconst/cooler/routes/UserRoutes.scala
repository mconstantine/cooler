package it.mconst.cooler.routes

import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware._
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.models.user.given
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result._
import org.http4s.AuthedRoutes
import org.http4s.dsl.io._

object UserRoutes {
  val routes: AuthedRoutes[UserContext, IO] = AuthedRoutes.of {
    case ctxReq @ POST -> Root as context => {
      given Lang = context.lang
      given Option[User] = Some(context.user)

      for
        data <- ctxReq.req.as[User.CreationData]
        response <- Users.register(data).flatMap(_.toResponse)
      yield response
    }
    case ctxReq @ PUT -> Root / "me" as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[User.UpdateData]
        response <- Users.update(data).flatMap(_.toResponse)
      yield response
    }
    case ctxReq @ DELETE -> Root / "me" as context => {
      given Lang = context.lang
      given User = context.user

      Users.delete.flatMap(_.toResponse)
    }
    case _ @GET -> Root / "me" as context => Ok(context.user)
  }

  def apply() = UserMiddleware(routes)
}
