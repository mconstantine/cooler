package it.mconst.cooler.routes

import cats.data.EitherT
import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.*
import it.mconst.cooler.models.project.Project
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.DatabaseName
import it.mconst.cooler.utils.given
import org.http4s.AuthedRoutes
import org.http4s.dsl.io.*

object NotCashedOnlyMatcher
    extends OptionalQueryParamDecoderMatcher[Boolean]("notCashedOnly")

object ProjectRoutes {
  def routes(using DatabaseName): AuthedRoutes[UserContext, IO] =
    AuthedRoutes.of {
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
          BeforeMatcher(before) +&
          NotCashedOnlyMatcher(notCashedOnly) as context => {
        given Lang = context.lang
        given User = context.user

        EitherT
          .fromEither[IO](CursorQuery(query, first, after, last, before))
          .flatMap(query =>
            Projects.find(query, notCashedOnly.getOrElse(false))
          )
          .toResponse
      }

      case GET -> Root / "latest" :?
          QueryMatcher(query) +&
          FirstMatcher(first) +&
          AfterMatcher(after) +&
          LastMatcher(last) +&
          BeforeMatcher(before) as context => {
        given Lang = context.lang
        given User = context.user

        EitherT
          .fromEither[IO](CursorQuery(query, first, after, last, before))
          .flatMap(Projects.getLatest(_))
          .toResponse
      }

      case GET -> Root / "cashedBalance" :?
          DateTimeMatcher(since) +&
          OptionalDateTimeMatcher(to) as context => {
        given User = context.user
        Ok(Projects.getCashedBalance(since, to))
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

  def apply()(using DatabaseName) = UserMiddleware(routes)
}