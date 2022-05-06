package it.mconst.cooler

import cats.effect._
import mongo4cats.client._
import mongo4cats.bson.ObjectId
import mongo4cats.collection.MongoCollection
import io.circe.generic.auto._
import mongo4cats.circe._
import mongo4cats.collection.operations.{Filter, Update}

import cats.effect.unsafe.implicits.global

extension [T](io: IO[T]) {
  def debug = io.map { value =>
    println(value)
    value
  }
}

object DatabasePlayground extends IOApp {
  val collectionName = "people"
  val dbName = "cooler"

  final case class Person(_id: ObjectId, firstName: String, lastName: String)

  def run[R](op: MongoCollection[IO, Person] => IO[R]): IO[R] = {
    MongoClient.fromConnectionString[IO](CoolerConfig.database.uri).use {
      connection =>
        for {
          db <- connection.getDatabase(dbName)
          collection <- db.getCollectionWithCodec[Person](collectionName)
          result <- op(collection)
        } yield (result)
    }
  }

  def create(p: Person): IO[Person] =
    run { collection =>
      for {
        result <- collection.insertOne(p)
        maybeDoc <- collection
          .find(Filter.eq("_id", result.getInsertedId))
          .first
        doc <- maybeDoc match {
          case Some(d) => IO.pure(d)
          case None =>
            IO.raiseError(new Exception("Could not find inserted document"))
        }
      } yield (doc)
    }

  def update(p: Person): IO[Person] =
    run { collection =>
      for {
        result <- collection.updateOne(
          Filter.eq("_id", p._id),
          Update.set("firstName", "Mario").set("lastName", "Martino")
        )
        maybeDoc <- collection.find(Filter.eq("_id", p._id)).first
        doc <- maybeDoc match {
          case Some(d) => IO.pure(d)
          case None =>
            IO.raiseError(new Exception("Could not find updated document"))
        }
      } yield (doc)
    }

  def delete(p: Person): IO[Person] =
    run { collection =>
      for {
        maybeDoc <- collection.find(Filter.eq("_id", p._id)).first
        doc <- maybeDoc match {
          case Some(d) => IO.pure(d)
          case None =>
            IO.raiseError(
              new Exception("Could not find document to be deleted")
            )
        }
        result <- collection.deleteOne(Filter.eq("_id", p._id))
      } yield (doc)
    }

  def drop: IO[Unit] = run(_.drop)

  override def run(args: List[String]): IO[ExitCode] = {
    val operation = for {
      person <- create(Person(new ObjectId(), "John", "Doe")).debug
      updated <- update(person).debug
      deleted <- delete(person).debug
      _ <- drop
    } yield (person)

    operation.as(ExitCode.Success)
  }
}
