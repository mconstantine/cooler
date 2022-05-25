package it.mconst.cooler.routes

import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.Client
import it.mconst.cooler.models.Clients
import it.mconst.cooler.models.given
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result._
import org.http4s.AuthedRoutes
import org.http4s.dsl.io._

object ClientRoutes {
  val routes: AuthedRoutes[UserContext, IO] = AuthedRoutes.of {
    case ctxReq @ POST -> Root as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[Client.CreationData]
        response <- Clients.create(data).flatMap(_.toResponse)
      yield response
    }
  }

  def apply() = UserMiddleware(routes)
}
