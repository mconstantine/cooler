package it.mconst.cooler.routes

import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.Client
import it.mconst.cooler.models.Clients
import it.mconst.cooler.models.given
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result._
import mongo4cats.bson.ObjectId
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

    case GET -> Root / id as context => {
      given Lang = context.lang
      given User = context.user

      ObjectId
        .from(id)
        .left
        .map(_ => Error(BadRequest, __.ErrorDecodeInvalidObjectId))
        .lift(Clients.findById(_))
        .flatMap(_.toResponse)
    }
  }

  def apply() = UserMiddleware(routes)
}
