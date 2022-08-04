package it.mconst.cooler.routes

import cats.data.EitherT
import cats.effect.IO
import cats.syntax.all.none
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.*
import it.mconst.cooler.models.task.Task
import it.mconst.cooler.models.task.Tasks
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.DatabaseName
import it.mconst.cooler.utils.given
import mongo4cats.bson.ObjectId
import org.http4s.AuthedRoutes
import org.http4s.dsl.impl.OptionalQueryParamDecoderMatcher
import org.http4s.dsl.io.*

object ProjectIdMatcher
    extends OptionalQueryParamDecoderMatcher[ObjectId]("project")

object TaskRoutes {
  def routes(using DatabaseName): AuthedRoutes[UserContext, IO] =
    AuthedRoutes.of {
      case ctxReq @ POST -> Root as context => {
        given Lang = context.lang
        given User = context.user

        for
          data <- ctxReq.req.as[Task.InputData]
          response <- Tasks.create(data).toResponse
        yield response
      }

      case ctxReq @ POST -> Root / "batch" as context => {
        given Lang = context.lang
        given User = context.user

        for
          data <- ctxReq.req.as[Task.BatchInputData]
          response <- Tasks.create(data).toResponse
        yield response
      }

      case GET -> Root :?
          ProjectIdMatcher(project) +&
          FirstMatcher(first) +&
          AfterMatcher(after) +&
          LastMatcher(last) +&
          BeforeMatcher(before) as context => {
        given Lang = context.lang
        given User = context.user

        EitherT
          .fromEither[IO](CursorNoQuery(first, after, last, before))
          .flatMap(Tasks.find(_, project))
          .toResponse
      }

      case GET -> Root / "due" :?
          DateTimeMatcher(since) +&
          OptionalDateTimeMatcher(to) as context => {
        given User = context.user
        Ok(Tasks.getDue(since, to))
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

  def apply()(using DatabaseName) = UserMiddleware(routes)
}
