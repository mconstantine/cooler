package it.mconst.cooler.routes

import org.http4s.dsl.impl.OptionalQueryParamDecoderMatcher
import mongo4cats.bson.ObjectId

object QueryMatcher extends OptionalQueryParamDecoderMatcher[String]("query")
object FirstMatcher extends OptionalQueryParamDecoderMatcher[Int]("first")
object AfterMatcher extends OptionalQueryParamDecoderMatcher[String]("after")
object LastMatcher extends OptionalQueryParamDecoderMatcher[Int]("last")
object BeforeMatcher extends OptionalQueryParamDecoderMatcher[String]("before")

object ObjectIdParam {
  def unapply(string: String): Option[ObjectId] =
    ObjectId.from(string).toOption
}
