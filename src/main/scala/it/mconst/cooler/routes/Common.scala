package it.mconst.cooler.routes

import cats.data.EitherT
import cats.Functor
import it.mconst.cooler.utils.Error
import mongo4cats.bson.ObjectId
import org.http4s.dsl.impl.OptionalQueryParamDecoderMatcher
import org.http4s.dsl.io.*
import org.http4s.EntityEncoder
import org.http4s.Response

object QueryMatcher extends OptionalQueryParamDecoderMatcher[String]("query")
object FirstMatcher extends OptionalQueryParamDecoderMatcher[Int]("first")
object AfterMatcher extends OptionalQueryParamDecoderMatcher[String]("after")
object LastMatcher extends OptionalQueryParamDecoderMatcher[Int]("last")
object BeforeMatcher extends OptionalQueryParamDecoderMatcher[String]("before")

object ObjectIdParam {
  def unapply(string: String): Option[ObjectId] =
    ObjectId.from(string).toOption
}

extension [F[_]: Functor, T](result: EitherT[F, Error, T]) {
  def toResponse(using
      we: EntityEncoder[F, Error],
      wr: EntityEncoder[F, T]
  ): F[Response[F]] =
    result.fold(
      e => Response[F](status = e.status, body = we.toEntity(e).body),
      r => Response[F](status = Ok, body = wr.toEntity(r).body)
    )
}
