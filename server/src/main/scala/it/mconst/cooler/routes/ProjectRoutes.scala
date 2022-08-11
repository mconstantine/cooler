package it.mconst.cooler.routes

import cats.data.EitherT
import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.*
import it.mconst.cooler.models.project.Project
import it.mconst.cooler.models.project.ProjectQueryFilters
import it.mconst.cooler.models.project.Projects
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.DatabaseName
import it.mconst.cooler.utils.given
import org.http4s.AuthedRoutes
import org.http4s.dsl.io.*

object CashFilterMatcher
    extends OptionalQueryParamDecoderMatcher[Boolean]("cashed")

object WithInvoiceDataFilterMatcher
    extends OptionalQueryParamDecoderMatcher[Boolean]("withInvoiceData")

object StartedFilterMatcher
    extends OptionalQueryParamDecoderMatcher[Boolean]("started")

object EndedFilterMatcher
    extends OptionalQueryParamDecoderMatcher[Boolean]("ended")

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
          CashFilterMatcher(cashed) +&
          WithInvoiceDataFilterMatcher(withInvoiceData) +&
          StartedFilterMatcher(started) +&
          EndedFilterMatcher(ended) as context => {
        given Lang = context.lang
        given User = context.user

        val filters =
          ProjectQueryFilters(cashed, withInvoiceData, started, ended)

        EitherT
          .fromEither[IO](CursorQuery(query, first, after, last, before))
          .flatMap(query => Projects.find(query, filters))
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

      case GET -> Root / "invoices" :?
          QueryMatcher(query) +&
          FirstMatcher(first) +&
          AfterMatcher(after) +&
          LastMatcher(last) +&
          BeforeMatcher(before) as context => {
        given Lang = context.lang
        given User = context.user

        EitherT
          .fromEither[IO](CursorQuery(query, first, after, last, before))
          .flatMap(Projects.findInvoices(_))
          .toResponse
      }

      case GET -> Root / ObjectIdParam(id) as context => {
        given Lang = context.lang
        given User = context.user

        Projects.findById(id).toResponse
      }

      case GET -> Root / ObjectIdParam(id) / "previous" as context => {
        given Lang = context.lang
        given User = context.user

        Projects.getPrevious(id).toResponse
      }

      case GET -> Root / ObjectIdParam(id) / "next" as context => {
        given Lang = context.lang
        given User = context.user

        Projects.getNext(id).toResponse
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
