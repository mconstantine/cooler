package it.mconst.cooler.routes

import cats.data.EitherT
import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.Cursor
import it.mconst.cooler.models.CursorQuery
import it.mconst.cooler.models.given
import it.mconst.cooler.models.Project
import it.mconst.cooler.models.Projects
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.given
import org.http4s.AuthedRoutes
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.http4s.EntityEncoder

object ProjectRoutes {
  val routes: AuthedRoutes[UserContext, IO] = AuthedRoutes.of {
    case ctxReq @ POST -> Root as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[Project.InputData]
        response <- Projects.create(data).toResponse
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

      given EntityEncoder[IO, Cursor[Project]] =
        jsonEncoderOf[IO, Cursor[Project]]

      EitherT
        .fromEither[IO](CursorQuery(query, first, after, last, before))
        .flatMap(Projects.find(_))
        .toResponse
    }

    case GET -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      Projects.findById(id).toResponse
    }

    case ctxReq @ PUT -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[Project.InputData]
        response <- Projects.update(id, data).toResponse
      yield response
    }

    case DELETE -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      Projects.delete(id).toResponse
    }
  }

  def apply() = UserMiddleware(routes)
}
