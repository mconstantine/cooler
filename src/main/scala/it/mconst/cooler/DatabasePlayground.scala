package it.mconst.cooler

import cats.effect._
import cats.effect.unsafe.implicits.global
import io.circe.generic.auto._
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.client._
import mongo4cats.collection.MongoCollection
import mongo4cats.collection.operations.{Filter, Update}
import com.osinka.i18n.Lang
import org.http4s.Status

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

object DatabasePlayground extends IOApp {
  // FIXME: each method should get a user with a language, or a header with a language
  given Lang = Lang.Default

  val collectionName = "people"
  val dbName = "cooler"

  final case class Person(_id: ObjectId, firstName: String, lastName: String)

  def run[R](op: MongoCollection[IO, Person] => IO[R]) = {
    MongoClient.fromConnectionString[IO](CoolerConfig.database.uri).use {
      connection =>
        for {
          db <- connection.getDatabase(dbName)
          collection <- db.getCollectionWithCodec[Person](collectionName)
          result <- op(collection)
        } yield (result)
    }
  }

  def create(p: Person) =
    run { collection =>
      for {
        result <- collection.insertOne(p)
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

  def update(p: Person) =
    run { collection =>
      for {
        result <- collection.updateOne(
          Filter.eq("_id", p._id),
          Update.set("firstName", "Mario").set("lastName", "Martino")
        )
        maybeDoc <- collection.find(Filter.eq("_id", p._id)).first
        doc <- IO(
          maybeDoc.toEither(() =>
            Error(Status.NotFound, Key.ErrorPersonNotFoundAfterUpdate)
          )
        )
      } yield (doc)
    }

  def delete(p: Person) =
    run { collection =>
      for {
        maybeDoc <- collection.find(Filter.eq("_id", p._id)).first
        doc <- IO(
          maybeDoc.toEither(() =>
            Error(Status.NotFound, Key.ErrorPersonNotFoundBeforeDelete)
          )
        )
        result <- collection.deleteOne(Filter.eq("_id", p._id))
      } yield (doc)
    }

  def drop: IO[Unit] = run(_.drop)

  override def run(args: List[String]): IO[ExitCode] = {
    // val operation = for {
    //   person <- create(Person(new ObjectId(), "John", "Doe")).debug
    //   updated <- update(person).debug
    //   deleted <- delete(person).debug
    //   _ <- drop
    // } yield (person)

    import io.circe.generic.auto.{deriveDecoder, deriveEncoder}
    import io.circe.syntax.EncoderOps

    update(Person(new ObjectId(), "John", "Doe")).debug.as(ExitCode.Success)
  }
}
