package it.mconst.cooler.routes

import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.Client
import it.mconst.cooler.models.Clients
import it.mconst.cooler.models.Cursor
import it.mconst.cooler.models.CursorQuery
import it.mconst.cooler.models.given
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result.*
import org.http4s.AuthedRoutes
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.http4s.EntityEncoder
import org.http4s.QueryParamDecoder

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

    case GET -> Root :?
        QueryMatcher(query) +&
        FirstMatcher(first) +&
        AfterMatcher(after) +&
        LastMatcher(last) +&
        BeforeMatcher(before) as context => {
      given Lang = context.lang
      given User = context.user

      given EntityEncoder[IO, Cursor[Client]] =
        jsonEncoderOf[IO, Cursor[Client]]

      CursorQuery(query, first, after, last, before)
        .lift(Clients.find(_))
        .flatMap(_.toResponse)
    }

    case GET -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      Clients.findById(id).flatMap(_.toResponse)
    }

    case ctxReq @ PUT -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[Client.UpdateData]
        response <- Clients.update(id, data).flatMap(_.toResponse)
      yield response
    }

    case DELETE -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      Clients.delete(id).flatMap(_.toResponse)
    }
  }

  def apply() = UserMiddleware(routes)
}
