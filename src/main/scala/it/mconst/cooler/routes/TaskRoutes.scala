package it.mconst.cooler.routes

import cats.data.EitherT
import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.*
import it.mconst.cooler.models.task.given
import it.mconst.cooler.models.task.Task
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.given
import org.http4s.AuthedRoutes
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.http4s.EntityEncoder

object TaskRoutes {
  val routes: AuthedRoutes[UserContext, IO] = AuthedRoutes.of {
    case ctxReq @ POST -> Root as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[Task.InputData]
        response <- Tasks.create(data).toResponse
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

      EitherT
        .fromEither[IO](CursorQuery(query, first, after, last, before))
        .flatMap(Tasks.find(_))
        .toResponse
    }

    case GET -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      Tasks.findById(id).toResponse
    }

    case ctxReq @ PUT -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[Task.InputData]
        response <- Tasks.update(id, data).toResponse
      yield response
    }

    case DELETE -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      Tasks.delete(id).toResponse
    }
  }

  def apply() = UserMiddleware(routes)
}
