package it.mconst.cooler

import cats.effect._
import cats.effect.unsafe.implicits.global
import com.mongodb.client.model.{Filters, Updates}
import com.osinka.i18n.Lang
import io.circe.{Encoder, Decoder, Json, HCursor}
import io.circe.generic.auto._
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.client._
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.MongoCollection
import mongo4cats.collection.operations.{Filter, Update}
import org.bson.BsonDateTime
import org.bson.conversions.Bson
import org.http4s.Status
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

extension [T](io: IO[T]) {
  def debug = io.map { value =>
    println(value)
    value
  }
}

case class Collection[Doc <: Document: ClassTag](name: String)(using Lang)(using
    MongoCodecProvider[Doc]
) {
  def use[R](op: MongoCollection[IO, Doc] => IO[R]) =
    MongoClient.fromConnectionString[IO](CoolerConfig.database.uri).use {
      connection =>
        for
          db <- connection.getDatabase(CoolerConfig.database.name)
          collection <- db.getCollectionWithCodec[Doc](name)
          result <- op(collection)
        yield result
    }

  def create(doc: Doc): IO[Either[Error, Doc]] =
    use { collection =>
      for
        result <- collection.insertOne(doc)
        maybeDoc <- collection
          .find(Filter.eq("_id", result.getInsertedId))
          .first
        doc <- IO(maybeDoc match
          case Some(doc) => Right(doc)
          case None =>
            Left(Error(Status.NotFound, Key.ErrorPersonNotFoundAfterInsert))
        )
      yield doc
    }

  def update(doc: Doc, update: Bson): IO[Either[Error, Doc]] =
    use { collection =>
      for
        result <- collection.updateOne(Filters.eq("_id", doc._id), update)
        maybeDoc <- collection.find(Filter.eq("_id", doc._id)).first
        updated <- IO(maybeDoc match
          case Some(doc) => Right(doc)
          case None =>
            Left(Error(Status.NotFound, Key.ErrorPersonNotFoundAfterUpdate))
        )
      yield updated
    }

  def update(doc: Doc, update: Update): IO[Either[Error, Doc]] =
    use { collection =>
      for
        result <- collection.updateOne(Filter.eq("_id", doc._id), update)
        maybeDoc <- collection.find(Filter.eq("_id", doc._id)).first
        updated <- IO(maybeDoc match
          case Some(doc) => Right(doc)
          case None =>
            Left(Error(Status.NotFound, Key.ErrorPersonNotFoundAfterUpdate))
        )
      yield updated
    }

  def delete(doc: Doc): IO[Either[Error, Doc]] =
    use { collection =>
      for
        maybeDoc <- collection.find(Filter.eq("_id", doc._id)).first
        original <- IO(maybeDoc match
          case Some(doc) => Right(doc)
          case None =>
            Left(Error(Status.NotFound, Key.ErrorPersonNotFoundBeforeDelete))
        )
        result <- collection.deleteOne(Filter.eq("_id", doc._id))
      yield original
    }

  def drop: IO[Unit] = use(_.drop)
}
