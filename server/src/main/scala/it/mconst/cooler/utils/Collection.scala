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
import com.mongodb.client.model.Updates
import com.mongodb.client.result.DeleteResult
import com.mongodb.client.result.UpdateResult
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.Decoder.Result
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.*
import io.circe.HCursor
import io.circe.Json
import it.mconst.cooler.models.Cursor
import it.mconst.cooler.models.CursorQuery
import it.mconst.cooler.models.CursorQueryAsc
import it.mconst.cooler.models.CursorQueryDesc
import it.mconst.cooler.models.PositiveInteger
import it.mconst.cooler.models.toBsonDateTime
import it.mconst.cooler.models.toInt
import it.mconst.cooler.models.toISOString
import mongo4cats.bson.Document
import mongo4cats.bson.ObjectId
import mongo4cats.circe.circeCodecProvider
import mongo4cats.client.MongoClient
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.MongoCollection
import mongo4cats.collection.operations.Filter
import mongo4cats.database.MongoDatabase
import org.bson.BsonDateTime
import org.bson.conversions.Bson
import org.http4s.dsl.io.*
import org.http4s.Status
import scala.collection.JavaConverters.*
import scala.reflect.ClassTag

trait DbDocument {
  def _id: ObjectId
  def createdAt: BsonDateTime
  def updatedAt: BsonDateTime
}

given Encoder[BsonDateTime] with Decoder[BsonDateTime] with {
  override def apply(datetime: BsonDateTime): Json =
    Encoder.encodeString(datetime.toISOString)
  override def apply(cursor: HCursor): Decoder.Result[BsonDateTime] =
    Decoder
      .decodeString(cursor)
      .flatMap(
        _.toBsonDateTime.left.map(_ =>
          DecodingFailure("ISOString", cursor.history)
        )
      )
}

object Collection {
  enum UpdateStrategy:
    case UnsetIfEmpty extends UpdateStrategy
    case IgnoreIfEmpty extends UpdateStrategy

  protected sealed abstract trait UpdateItem[T](key: String, value: T)

  protected final case class ValueUpdateItem[T](key: String, value: T)
      extends UpdateItem(key, value)

  protected final case class OptionUpdateItem[T](
      key: String,
      value: Option[T],
      updateStrategy: UpdateStrategy
  ) extends UpdateItem(key, value)

  protected final case class EmptyUpdate() {
    def `with`[T](value: (String, T))(using
        MongoCodecProvider[T]
    ): Update = Update(List(ValueUpdateItem(value._1, value._2)))

    def `with`[T](
        value: (String, Option[T]),
        updateStrategy: UpdateStrategy
    )(using
        MongoCodecProvider[T]
    ): Update = Update(
      List(OptionUpdateItem(value._1, value._2, updateStrategy))
    )
  }

  protected final case class Update(val values: List[UpdateItem[_]]) {
    def `with`[T](value: (String, T))(using
        MongoCodecProvider[T]
    ): Update = Update(ValueUpdateItem(value._1, value._2) :: values)

    def `with`(value: (String, Option[_])): Nothing =
      throw new IllegalArgumentException(
        "You mst provide an UpdateStrategy when updating an optional field"
      )

    def `with`[T](
        value: (String, Option[T]),
        updateStrategy: UpdateStrategy
    )(using MongoCodecProvider[T]): Update =
      Update(OptionUpdateItem(value._1, value._2, updateStrategy) :: values)

    def build: BuiltUpdate = BuiltUpdate(values)
  }

  protected final case class BuiltUpdate(val values: List[UpdateItem[_]])

  object Update {
    def `with`[T](value: (String, T))(using
        MongoCodecProvider[T]
    ): Update = EmptyUpdate().`with`(value)

    def `with`(value: (String, Option[_])): Nothing =
      throw new IllegalArgumentException(
        "You must provide an UpdateStrategy when updating an optional field"
      )

    def `with`[T](
        value: (String, Option[T]),
        updateStrategy: UpdateStrategy
    )(using
        MongoCodecProvider[T]
    ): Update = EmptyUpdate().`with`[T](value, updateStrategy)
  }
}

final case class Collection[F[
    _
]: Async, Input: ClassTag, Doc <: DbDocument: ClassTag](name: String)(using
    F: Monad[F],
    dbName: DatabaseName
)(using MongoCodecProvider[Input], MongoCodecProvider[Doc]) {
  protected final case class CollectionResource[F[
      _
  ]: Async, Input: ClassTag, Doc <: DbDocument: ClassTag](
      db: MongoDatabase[F],
      collectionCodecDecorator: MongoCollection[F, Document] => MongoCollection[
        F,
        Document
      ] = identity[MongoCollection[F, Document]]
  )(using
      MongoCodecProvider[Input],
      MongoCodecProvider[Doc]
  ) {
    def findOne[T: ClassTag](
        filter: Filter
    )(using Lang, MongoCodecProvider[T]): EitherT[F, Error, T] =
      EitherT.fromOptionF(
        db.getCollectionWithCodec[T](name).flatMap(_.find(filter).first),
        Error(NotFound, __.ErrorDocumentNotFound)
      )

    def create(
        doc: Doc
    )(using Lang): EitherT[F, Error, ObjectId] =
      EitherT(
        db.getCollectionWithCodec[Doc](name)
          .flatMap(
            _.insertOne(doc).map(result =>
              Option(result.getInsertedId)
                .map(_.asObjectId.getValue)
                .toRight(
                  Error(Status.NotFound, __.ErrorDocumentNotFoundAfterInsert)
                )
            )
          )
      )

    def createAndReturn(
        doc: Doc
    )(using Lang): EitherT[F, Error, Doc] =
      for
        result <- EitherT.liftF(
          db.getCollectionWithCodec[Doc](name).flatMap(_.insertOne(doc))
        )
        inserted <- findOne[Doc](Filter.eq("_id", result.getInsertedId))
          .leftMap(_ => Error(NotFound, __.ErrorDocumentNotFoundAfterInsert))
      yield inserted

    def update(_id: ObjectId, update: Collection.BuiltUpdate)(using
        Lang
    ): EitherT[F, Error, UpdateResult] = {
      val providedUpdates = update.values
        .map(
          _ match
            case update: Collection.ValueUpdateItem[_] =>
              Some(
                Updates.set(
                  update.key,
                  update.value match
                    case value: BsonDateTime => value.toISOString
                    case _                   => update.value
                )
              )
            case update: Collection.OptionUpdateItem[_] =>
              update.value match
                case Some(value) =>
                  Some(
                    Updates.set(
                      update.key,
                      value match
                        case value: BsonDateTime => value.toISOString
                        case _                   => value
                    )
                  )
                case None =>
                  update.updateStrategy match
                    case Collection.UpdateStrategy.IgnoreIfEmpty => none[Bson]
                    case Collection.UpdateStrategy.UnsetIfEmpty =>
                      Some(Updates.unset(update.key))
        )
        .map(_.toList)
        .flatten

      val updatedAtUpdate = List(
        Updates.set(
          "updatedAt",
          BsonDateTime(System.currentTimeMillis).toISOString
        )
      )

      val allUpdates = providedUpdates ++ updatedAtUpdate

      EitherT.liftF(
        db.getCollection(name)
          .map(collectionCodecDecorator)
          .flatMap(
            _.updateOne(
              Filters.eq("_id", _id),
              Updates.combine(allUpdates.asJava)
            )
          )
      )
    }

    def delete(_id: ObjectId)(using Lang): EitherT[F, Error, DeleteResult] =
      EitherT.liftF(
        db.getCollection(name).flatMap(_.deleteOne(Filter.eq("_id", _id)))
      )

    def drop: F[Unit] = db.getCollection(name).flatMap(_.drop)

    def raw[R](op: MongoCollection[F, Doc] => F[R]): F[R] =
      db.getCollectionWithCodec[Doc](name).flatMap(op)

    def find[O](
        searchKey: String,
        initialFilters: Seq[Bson]
    )(using
        Lang,
        Encoder[O],
        Decoder[O]
    ): CursorQuery => EitherT[F, Error, Cursor[O]] = { query =>
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
        case q: CursorQueryAsc =>
          q.after.fold(Filters.empty)(Filters.gt(searchKey, _))
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
              Aggregates.limit(
                limit
                  .getOrElse(PositiveInteger.unsafe(Config.defaultPageSize))
                  .toInt
              )
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
              "totalCount" -> Document(
                "$ifNull" -> List("$global.totalCount", 0)
              ),
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
        db.getCollection(name)
          .flatMap(_.aggregateWithCodec[Cursor[O]](aggregation).first),
        Error(InternalServerError, __.ErrorUnknown)
      )
    }
  }

  private def resource: Resource[F, MongoDatabase[F]] =
    MongoClient
      .fromConnectionString[F](Config.database.uri)
      .flatMap(client =>
        Resource.make(client.getDatabase(dbName.toString))(_ => F.unit)
      )

  def use[R](op: CollectionResource[F, Input, Doc] => F[R]): F[R] =
    resource.use(db => op(CollectionResource(db)))

  def use[R](
      op: CollectionResource[F, Input, Doc] => OptionT[F, R]
  ): OptionT[F, R] =
    OptionT(resource.use(db => op(CollectionResource(db)).value))

  def use[E, R](
      op: CollectionResource[F, Input, Doc] => EitherT[F, E, R]
  ): EitherT[F, E, R] =
    EitherT(resource.use(db => op(CollectionResource(db)).value))

  def useWithCodec[C, R](
      op: CollectionResource[F, Input, Doc] => F[R]
  )(using ClassTag[C], MongoCodecProvider[C]): F[R] =
    resource.use(db => op(CollectionResource(db, _.withAddedCodec[C])))

  def useWithCodec[C1, C2, R](
      op: CollectionResource[F, Input, Doc] => F[R]
  )(using
      ClassTag[C1],
      ClassTag[C2],
      MongoCodecProvider[C1],
      MongoCodecProvider[C2]
  ): F[R] =
    resource.use(db =>
      op(CollectionResource(db, _.withAddedCodec[C1].withAddedCodec[C2]))
    )

  def useWithCodec[C1, C2, C3, R](
      op: CollectionResource[F, Input, Doc] => F[R]
  )(using
      ClassTag[C1],
      ClassTag[C2],
      ClassTag[C3],
      MongoCodecProvider[C1],
      MongoCodecProvider[C2],
      MongoCodecProvider[C3]
  ): F[R] =
    resource.use(db =>
      op(
        CollectionResource(
          db,
          _.withAddedCodec[C1].withAddedCodec[C2].withAddedCodec[C3]
        )
      )
    )

  def useWithCodec[C, R](
      op: CollectionResource[F, Input, Doc] => OptionT[F, R]
  )(using ClassTag[C], MongoCodecProvider[C]): OptionT[F, R] =
    OptionT(
      resource.use(db => op(CollectionResource(db, _.withAddedCodec[C])).value)
    )

  def useWithCodec[C1, C2, R](
      op: CollectionResource[F, Input, Doc] => OptionT[F, R]
  )(using
      ClassTag[C1],
      ClassTag[C2],
      MongoCodecProvider[C1],
      MongoCodecProvider[C2]
  ): OptionT[F, R] =
    OptionT(
      resource.use(db =>
        op(
          CollectionResource(db, _.withAddedCodec[C1].withAddedCodec[C2])
        ).value
      )
    )

  def useWithCodec[C1, C2, C3, R](
      op: CollectionResource[F, Input, Doc] => OptionT[F, R]
  )(using
      ClassTag[C1],
      ClassTag[C2],
      ClassTag[C3],
      MongoCodecProvider[C1],
      MongoCodecProvider[C2],
      MongoCodecProvider[C3]
  ): OptionT[F, R] =
    OptionT(
      resource.use(db =>
        op(
          CollectionResource(
            db,
            _.withAddedCodec[C1].withAddedCodec[C2].withAddedCodec[C3]
          )
        ).value
      )
    )

  def useWithCodec[C, E, R](
      op: CollectionResource[F, Input, Doc] => EitherT[F, E, R]
  )(using ClassTag[C], MongoCodecProvider[C]): EitherT[F, E, R] =
    EitherT(
      resource.use(db => op(CollectionResource(db, _.withAddedCodec[C])).value)
    )

  def useWithCodec[C1, C2, E, R](
      op: CollectionResource[F, Input, Doc] => EitherT[F, E, R]
  )(using
      ClassTag[C1],
      ClassTag[C2],
      MongoCodecProvider[C1],
      MongoCodecProvider[C2]
  ): EitherT[F, E, R] =
    EitherT(
      resource.use(db =>
        op(
          CollectionResource(db, _.withAddedCodec[C1].withAddedCodec[C2])
        ).value
      )
    )

  def useWithCodec[C1, C2, C3, E, R](
      op: CollectionResource[F, Input, Doc] => EitherT[F, E, R]
  )(using
      ClassTag[C1],
      ClassTag[C2],
      ClassTag[C3],
      MongoCodecProvider[C1],
      MongoCodecProvider[C2],
      MongoCodecProvider[C3]
  ): EitherT[F, E, R] =
    EitherT(
      resource.use(db =>
        op(
          CollectionResource(
            db,
            _.withAddedCodec[C1].withAddedCodec[C2].withAddedCodec[C3]
          )
        ).value
      )
    )
}
