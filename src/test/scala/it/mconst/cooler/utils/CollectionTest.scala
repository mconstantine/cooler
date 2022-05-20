package it.mconst.cooler.utils

import it.mconst.cooler.utils.TestUtils._
import munit.{Assertions, CatsEffectSuite}

import cats.effect.{IO, Resource}
import cats.effect.unsafe.implicits.global
import com.osinka.i18n.Lang
import io.circe.generic.auto._
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.operations.{Filter, Update}

class CollectionTest extends CatsEffectSuite {
  given Lang = Lang.Default
  given Assertions = this

  case class Person(_id: ObjectId, firstName: String, lastName: String)
      extends Document

  val people = Collection[Person]("people")

  val dropFixture =
    ResourceSuiteLocalFixture("drop", Resource.make(IO.unit)(_ => people.drop))

  override val munitFixtures = List(dropFixture)

  test("should create a document") {
    val person = Person(new ObjectId(), "John", "Doe")
    people.create(person).assertEquals(Right(person))
  }

  test("should update a document") {
    val person = Person(new ObjectId(), "John", "Doe")
    val update = Update.set("firstName", "Mario").set("lastName", "Martino")

    for
      update <- people
        .create(person)
        .orFail
        .flatMap(people.update(_, update).orFail)
      _ = assertEquals(update.firstName, "Mario")
      _ = assertEquals(update.lastName, "Martino")
    yield ()
  }

  test("should delete a document") {
    val person = Person(new ObjectId(), "John", "Doe")

    for
      _ <- people.create(person)
      result <- people.delete(person).assertEquals(Right(person))
      _ <- people
        .use(_.find(Filter.eq("_id", person._id)).first)
        .assertEquals(None)
    yield ()
  }
}
