package it.mconst.cooler.routes

import cats.data.EitherT
import cats.effect.IO
import com.osinka.i18n.Lang
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.middlewares.UserMiddleware.UserContext
import it.mconst.cooler.models.*
import it.mconst.cooler.models.tax.given
import it.mconst.cooler.models.tax.Tax
import it.mconst.cooler.models.tax.Taxes
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.given
import org.http4s.AuthedRoutes
import org.http4s.dsl.io.*
import org.http4s.implicits.*

object TaxRoutes {
  val routes: AuthedRoutes[UserContext, IO] = AuthedRoutes.of {
    case ctxReq @ POST -> Root as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[Tax.InputData]
        response <- Taxes.create(data).toResponse
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
        .flatMap(Taxes.find(_))
        .toResponse
    }

    case ctxReq @ PUT -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      for
        data <- ctxReq.req.as[Tax.InputData]
        response <- Taxes.update(id, data).toResponse
      yield response
    }

    case ctxReq @ DELETE -> Root / ObjectIdParam(id) as context => {
      given Lang = context.lang
      given User = context.user

      Taxes.delete(id).toResponse
    }
  }

  def apply() = UserMiddleware(routes)
}
