package it.mconst.cooler.utils

import cats.data.EitherT
import cats.data.OptionT
import cats.effect.kernel.Async
import cats.effect.kernel.Resource
import cats.implicits.*
import cats.Monad
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.BsonField
import com.mongodb.client.model.Facet
import com.mongodb.client.model.Filters
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
import it.mconst.cooler.utils.Error
import mongo4cats.bson.Document
import mongo4cats.bson.ObjectId
import mongo4cats.circe.circeCodecProvider
import mongo4cats.client.MongoClient
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.MongoCollection
import mongo4cats.collection.operations.Filter
import mongo4cats.collection.operations.Update
import org.bson.BsonDateTime
import org.bson.conversions.Bson
import org.http4s.dsl.io.*
import scala.collection.JavaConverters.*
import scala.reflect.ClassTag

// TODO: create and update could probably handle `createdAt` and `updatedAt` by themselves
// TODO: `use` should be callable with `EitherT` and `OptionT`
trait DbDocument {
  def _id: ObjectId
  def createdAt: BsonDateTime
  def updatedAt: BsonDateTime
}

given Encoder[BsonDateTime] with Decoder[BsonDateTime] with {
  override def apply(datetime: BsonDateTime): Json =
    Encoder.encodeLong(datetime.getValue)
  override def apply(cursor: HCursor): Decoder.Result[BsonDateTime] =
    Decoder.decodeLong.map(BsonDateTime(_))(cursor)
}

final case class Collection[F[_]: Async, Doc: ClassTag](name: String)(using
    F: Monad[F]
)(using
    MongoCodecProvider[Doc]
) {
  protected final case class CollectionResource[F[_]: Async, Doc: ClassTag](
      c: MongoCollection[F, Doc]
  )(using F: Monad[F])(using MongoCodecProvider[Doc]) {
    def findOne(filter: Filter)(using Lang): EitherT[F, Error, Doc] =
      EitherT.fromOptionF(
        c.find(filter).first,
        Error(NotFound, __.ErrorDocumentNotFound)
      )

    def create(doc: Doc)(using Lang): EitherT[F, Error, Doc] =
      for
        result <- EitherT.liftF(c.insertOne(doc))
        inserted <- findOne(Filter.eq("_id", result.getInsertedId)).leftMap(_ =>
          Error(NotFound, __.ErrorDocumentNotFoundAfterInsert)
        )
      yield inserted

    def update(_id: ObjectId, update: Bson)(using
        Lang
    ): EitherT[F, Error, Doc] =
      for
        result <- EitherT.liftF(c.updateOne(Filters.eq("_id", _id), update))
        updated <- findOne(Filter.eq("_id", _id)).leftMap(_ =>
          Error(NotFound, __.ErrorDocumentNotFoundAfterUpdate)
        )
      yield updated

    def update(_id: ObjectId, update: Update)(using
        Lang
    ): EitherT[F, Error, Doc] = {
      val filter = Filter.eq("_id", _id)

      for
        result <- EitherT.liftF(c.updateOne(filter, update))
        updated <- findOne(filter).leftMap(_ =>
          Error(NotFound, __.ErrorDocumentNotFoundAfterUpdate)
        )
      yield updated
    }

    def delete(_id: ObjectId)(using Lang): EitherT[F, Error, Doc] = {
      val filter = Filter.eq("_id", _id)

      for
        original <- findOne(filter).leftMap(_ =>
          Error(NotFound, __.ErrorDocumentNotFoundBeforeDelete)
        )
        deleted <- EitherT.liftF(c.deleteOne(filter).map(_ => original))
      yield deleted
    }

    def drop: F[Unit] = c.drop

    def raw[R](op: MongoCollection[F, Doc] => F[R]): F[R] = op(c)

    def find(
        searchKey: String,
        initialFilters: Seq[Bson]
    )(using
        Lang,
        Encoder[Doc],
        Decoder[Doc]
    ): CursorQuery => EitherT[F, Error, Cursor[Doc]] = { query =>
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
        case _: CursorQueryAsc  => Document("$min" -> s"$$$searchKey")
        case _: CursorQueryDesc => Document("$max" -> s"$$$searchKey")

      val maxCriteria = query match
        case _: CursorQueryAsc  => Document("$max" -> s"$$$searchKey")
        case _: CursorQueryDesc => Document("$min" -> s"$$$searchKey")

      val rest = Seq(
        Aggregates.sort(Document(s"$searchKey" -> sortingOrder)),
        Aggregates.facet(
          Facet(
            "global",
            List(
              Aggregates.group(
                null,
                List(
                  BsonField("totalCount", Document("$sum" -> 1)),
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
          Document(
            "edges" -> Document(
              "$map" -> Document(
                "input" -> "$data",
                "as" -> "item",
                "in" -> Document(
                  "node" -> "$$item",
                  "cursor" -> s"$$$$item.$searchKey"
                )
              )
            ),
            "global" -> Document(
              "$arrayElemAt" -> List("$global", 0)
            ),
            "order" -> Document(
              "$map" -> Document(
                "input" -> "$data",
                "as" -> "item",
                "in" -> s"$$$$item.$searchKey"
              )
            )
          )
        ),
        Aggregates.project(
          Document(
            "edges" -> "$edges",
            "global" -> "$global",
            "min" -> Document(
              "$arrayElemAt" -> List(Document("$slice" -> List("$order", 1)), 0)
            ),
            "max" -> Document(
              "$arrayElemAt" -> List(
                Document("$slice" -> List("$order", -1)),
                0
              )
            )
          )
        ),
        Aggregates.project(
          Document(
            "edges" -> "$edges",
            "pageInfo" -> Document(
              "totalCount" -> "$global.totalCount",
              "startCursor" -> "$min",
              "endCursor" -> "$max",
              "hasPreviousPage" -> Document(
                "$ne" -> List("$global.min", "$min")
              ),
              "hasNextPage" -> Document("$ne" -> List("$global.max", "$max"))
            )
          )
        )
      )

      val aggregation = initialFilters ++ findByQuery ++ rest

      EitherT.fromOptionF(
        c.aggregateWithCodec[Cursor[Doc]](aggregation).first,
        Error(InternalServerError, __.ErrorUnknown)
      )
    }
  }

  private def resource: Resource[F, MongoCollection[F, Doc]] =
    MongoClient
      .fromConnectionString[F](Config.database.uri)
      .flatMap(client =>
        Resource.make(
          client
            .getDatabase(Config.database.name)
            .flatMap(
              _.getCollectionWithCodec[Doc](name)
            )
        )(_ => F.unit)
      )

  def use[R](op: CollectionResource[F, Doc] => F[R]): F[R] =
    resource.use(c => op(CollectionResource(c)))

  def use[R](op: CollectionResource[F, Doc] => OptionT[F, R]): OptionT[F, R] =
    OptionT(resource.use(c => op(CollectionResource(c)).value))

  def use[E, R](
      op: CollectionResource[F, Doc] => EitherT[F, E, R]
  ): EitherT[F, E, R] =
    EitherT(resource.use(c => op(CollectionResource(c)).value))
}
