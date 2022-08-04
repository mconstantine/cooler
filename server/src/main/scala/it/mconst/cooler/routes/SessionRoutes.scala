package it.mconst.cooler.routes

import cats.data.EitherT
import cats.effect.IO
import cats.syntax.all.none
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.*
import it.mconst.cooler.models.session.Session
import it.mconst.cooler.models.session.Sessions
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.DatabaseName
import it.mconst.cooler.utils.given
import org.http4s.AuthedRoutes
import org.http4s.dsl.io.*

object SessionRoutes {
  def routes(using DatabaseName): AuthedRoutes[UserContext, IO] =
    AuthedRoutes.of {
      case ctxReq @ POST -> Root as context => {
        given Lang = context.lang
        given User = context.user

        for
          data <- ctxReq.req.as[Session.InputData]
          response <- Sessions.start(data).toResponse
        yield response
      }

      case GET -> Root / "open" as context => {
        given Lang = context.lang
        given User = context.user

        Ok(Sessions.getOpenSessions)
      }

      case GET -> Root / "task" / ObjectIdParam(taskId) :?
          FirstMatcher(first) +&
          AfterMatcher(after) +&
          LastMatcher(last) +&
          BeforeMatcher(before) as context => {
        given Lang = context.lang
        given User = context.user

        EitherT
          .fromEither[IO](CursorNoQuery(first, after, last, before))
          .flatMap(Sessions.getSessions(_, taskId))
          .toResponse
      }

      case GET -> Root / ObjectIdParam(id) as context => {
        given Lang = context.lang
        given User = context.user

        Sessions.findById(id).toResponse
      }

      case ctxReq @ PUT -> Root / ObjectIdParam(id) as context => {
        given Lang = context.lang
        given User = context.user

        for
          data <- ctxReq.req.as[Session.InputData]
          response <- Sessions.update(id, data).toResponse
        yield response
      }

      case DELETE -> Root / ObjectIdParam(id) as context => {
        given Lang = context.lang
        given User = context.user

        Sessions.delete(id).toResponse
      }
    }

  def apply()(using DatabaseName) = UserMiddleware(routes)
}
