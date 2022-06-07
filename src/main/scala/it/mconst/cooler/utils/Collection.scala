package it.mconst.cooler.utils

import cats.effect.*
import cats.effect.unsafe.implicits.global
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.BsonField
import com.mongodb.client.model.Facet
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Updates
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.Encoder
import io.circe.generic.auto.*
import io.circe.HCursor
import io.circe.Json
import it.mconst.cooler.models.Cursor
import it.mconst.cooler.models.CursorQuery
import it.mconst.cooler.models.CursorQueryAsc
import it.mconst.cooler.models.CursorQueryDesc
import it.mconst.cooler.utils.Config
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.Result.*
import it.mconst.cooler.utils.Translations
import mongo4cats.bson.Document as Doc
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.client.*
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.MongoCollection
import mongo4cats.collection.operations.Filter
import mongo4cats.collection.operations.Update
import org.bson.BsonDateTime
import org.bson.conversions.Bson
import org.http4s.dsl.io.*
import scala.collection.JavaConverters.*
import scala.reflect.ClassTag

abstract trait Document:
  val _id: ObjectId

abstract trait Timestamps:
  val createdAt: BsonDateTime
  val updatedAt: BsonDateTime

given Encoder[BsonDateTime] with Decoder[BsonDateTime] with {
  override def apply(datetime: BsonDateTime): Json =
    Encoder.encodeLong(datetime.getValue)
  override def apply(cursor: HCursor): Decoder.Result[BsonDateTime] =
    Decoder.decodeLong.map(BsonDateTime(_))(cursor)
}

case class Collection[Doc <: Document: ClassTag](name: String)(using
    MongoCodecProvider[Doc]
) {
  def use[R](op: MongoCollection[IO, Doc] => IO[R]) =
    MongoClient.fromConnectionString[IO](Config.database.uri).use {
      connection =>
        for
          db <- connection.getDatabase(Config.database.name)
          collection <- db.getCollectionWithCodec[Doc](name)
          result <- op(collection)
        yield result
    }

  def create(doc: Doc)(using Lang): IO[Result[Doc]] =
    use { collection =>
      for
        result <- collection.insertOne(doc)
        doc <- collection
          .find(Filter.eq("_id", result.getInsertedId))
          .first
          .map(_.toRight(Error(NotFound, __.ErrorDocumentNotFoundAfterInsert)))
      yield doc
    }

  def find[T <: Document](
      searchKey: String,
      initialFilters: Seq[Bson]
  )(using
      Lang,
      Encoder[T],
      Decoder[T]
  ): CursorQuery => IO[Result[Cursor[T]]] = { query =>
    val queryString = query match
      case q: CursorQueryAsc  => q.query
      case q: CursorQueryDesc => q.query

    val findByQuery = queryString.fold(Seq.empty)(query =>
      Seq(
        Aggregates.`match`(Filters.regex(searchKey, query, "i"))
      )
    )

    val sortingOrder: 1 | -1 = query match
      case _: CursorQueryAsc  => 1
      case _: CursorQueryDesc => -1

    val skipCriteria = query match
      case q: CursorQueryAsc => Filters.gt(searchKey, q.after.getOrElse(""))
      case q: CursorQueryDesc =>
        q.before.fold(Filters.empty)(Filters.lt(searchKey, _))

    val limit = query match
      case q: CursorQueryAsc  => q.first
      case q: CursorQueryDesc => q.last

    val minCriteria = query match
      case _: CursorQueryAsc  => Doc("$min" -> s"$$$searchKey")
      case _: CursorQueryDesc => Doc("$max" -> s"$$$searchKey")

    val maxCriteria = query match
      case _: CursorQueryAsc  => Doc("$max" -> s"$$$searchKey")
      case _: CursorQueryDesc => Doc("$min" -> s"$$$searchKey")

    val rest = Seq(
      Aggregates.sort(Doc(s"$searchKey" -> sortingOrder)),
      Aggregates.facet(
        Facet(
          "global",
          List(
            Aggregates.group(
              null,
              List(
                BsonField("totalCount", Doc("$sum" -> 1)),
                BsonField("min", minCriteria),
                BsonField("max", maxCriteria)
              ).asJava
            )
          ).asJava
        ),
        Facet(
          "data",
          List(
            Aggregates.`match`(skipCriteria),
            Aggregates.limit(limit.getOrElse(Config.defaultPageSize))
          ).asJava
        )
      ),
      Aggregates.project(
        Doc(
          "edges" -> Doc(
            "$map" -> Doc(
              "input" -> "$data",
              "as" -> "item",
              "in" -> Doc(
                "node" -> "$$item",
                "cursor" -> s"$$$$item.$searchKey"
              )
            )
          ),
          "global" -> Doc(
            "$arrayElemAt" -> List("$global", 0)
          ),
          "order" -> Doc(
            "$map" -> Doc(
              "input" -> "$data",
              "as" -> "item",
              "in" -> s"$$$$item.$searchKey"
            )
          )
        )
      ),
      Aggregates.project(
        Doc(
          "edges" -> "$edges",
          "global" -> "$global",
          "min" -> Doc(
            "$arrayElemAt" -> List(Doc("$slice" -> List("$order", 1)), 0)
          ),
          "max" -> Doc(
            "$arrayElemAt" -> List(Doc("$slice" -> List("$order", -1)), 0)
          )
        )
      ),
      Aggregates.project(
        Doc(
          "edges" -> "$edges",
          "pageInfo" -> Doc(
            "totalCount" -> "$global.totalCount",
            "startCursor" -> "$min",
            "endCursor" -> "$max",
            "hasPreviousPage" -> Doc("$ne" -> List("$global.min", "$min")),
            "hasNextPage" -> Doc("$ne" -> List("$global.max", "$max"))
          )
        )
      )
    )

    val aggregation = initialFilters ++ findByQuery ++ rest

    use(
      _.aggregateWithCodec[Cursor[T]](aggregation).first
        .map(_.toRight(Error(InternalServerError, __.ErrorUnknown)))
    )
  }

  def update(doc: Doc, update: Bson)(using Lang): IO[Result[Doc]] =
    use { collection =>
      for
        result <- collection.updateOne(Filters.eq("_id", doc._id), update)
        updated <- collection
          .find(Filter.eq("_id", doc._id))
          .first
          .map(_.toRight(Error(NotFound, __.ErrorDocumentNotFoundAfterUpdate)))
      yield updated
    }

  def update(doc: Doc, update: Update)(using Lang): IO[Result[Doc]] =
    use { collection =>
      for
        result <- collection.updateOne(Filter.eq("_id", doc._id), update)
        updated <- collection
          .find(Filter.eq("_id", doc._id))
          .first
          .map(_.toRight(Error(NotFound, __.ErrorDocumentNotFoundAfterUpdate)))
      yield updated
    }

  def delete(doc: Doc)(using Lang): IO[Result[Doc]] =
    use { collection =>
      for
        original <- collection
          .find(Filter.eq("_id", doc._id))
          .first
          .map(_.toRight(Error(NotFound, __.ErrorDocumentNotFoundBeforeDelete)))
        result <- collection.deleteOne(Filter.eq("_id", doc._id))
      yield original
    }

  def drop: IO[Unit] = use(_.drop)
}
