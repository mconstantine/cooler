package it.mconst.cooler

import cats.effect._
import cats.effect.unsafe.implicits.global
import com.osinka.i18n.Lang
import io.circe.generic.auto._
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.client._
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.MongoCollection
import mongo4cats.collection.operations.{Filter, Update}
import org.http4s.Status
import scala.reflect.ClassTag

abstract trait Document {
  val _id: ObjectId
}

extension [T](io: IO[T]) {
  def debug = io.map { value =>
    println(value)
    value
  }
}

extension [E, T](option: Option[T]) {
  def toEither(onNone: () => E): Either[E, T] = option match {
    case Some(value) => Right(value)
    case None        => Left(onNone())
  }
}

extension [E, T](ioEither: IO[Either[E, T]]) {
  def chainIOEither[R](
      f: T => IO[Either[E, R]]
  ): IO[Either[E, R]] =
    ioEither.flatMap(result =>
      result match {
        case Right(value) => f(value)
        case Left(error)  => IO.pure(Left(error))
      }
    )
}

case class Collection[Doc <: Document: ClassTag](name: String)(using Lang)(using
    MongoCodecProvider[Doc]
) {
  def run[R](op: MongoCollection[IO, Doc] => IO[R]) = {
    MongoClient.fromConnectionString[IO](CoolerConfig.database.uri).use {
      connection =>
        for {
          db <- connection.getDatabase(CoolerConfig.database.name)
          collection <- db.getCollectionWithCodec[Doc](name)
          result <- op(collection)
        } yield (result)
    }
  }

  def create(doc: Doc) =
    run { collection =>
      for {
        result <- collection.insertOne(doc)
        maybeDoc <- collection
          .find(Filter.eq("_id", result.getInsertedId))
          .first
        doc <- IO(
          maybeDoc.toEither(() =>
            Error(Status.NotFound, Key.ErrorPersonNotFoundAfterInsert)
          )
        )
      } yield (doc)
    }

  def update(doc: Doc, update: Update) =
    run { collection =>
      for {
        result <- collection.updateOne(Filter.eq("_id", doc._id), update)
        maybeDoc <- collection.find(Filter.eq("_id", doc._id)).first
        updated <- IO(
          maybeDoc.toEither(() =>
            Error(Status.NotFound, Key.ErrorPersonNotFoundAfterUpdate)
          )
        )
      } yield (updated)
    }

  def delete(doc: Doc) =
    run { collection =>
      for {
        maybeDoc <- collection.find(Filter.eq("_id", doc._id)).first
        original <- IO(
          maybeDoc.toEither(() =>
            Error(Status.NotFound, Key.ErrorPersonNotFoundBeforeDelete)
          )
        )
        result <- collection.deleteOne(Filter.eq("_id", doc._id))
      } yield (original)
    }

  def drop: IO[Unit] = run(_.drop)
}
