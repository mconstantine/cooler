package it.mconst.cooler

import org.scalatest._
import matchers._
import flatspec._

import cats.effect.unsafe.implicits.global
import com.osinka.i18n.Lang
import io.circe.generic.auto._
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.operations.{Filter, Update}

class CollectionTest extends AnyFlatSpec with should.Matchers {
  given Lang = Lang.Default

  case class Person(_id: ObjectId, firstName: String, lastName: String)
      extends Document

  val people = Collection[Person]("people")

  it should "create a document" in {
    val person = Person(new ObjectId(), "John", "Doe")
    val result =
      people.create(person).unsafeRunSync()

    result shouldEqual Right(person)
  }

  it should "update a document" in {
    val person = Person(new ObjectId(), "John", "Doe")
    val update = Update.set("firstName", "Mario").set("lastName", "Martino")

    val result = people
      .create(person)
      .chainIOEither(people.update(_, update))
      .unsafeRunSync()
      .getOrElse(null)

    result.firstName shouldBe "Mario"
    result.lastName shouldBe "Martino"
  }

  it should "delete a document" in {
    val person = Person(new ObjectId(), "John", "Doe")

    val result =
      people
        .create(person)
        .chainIOEither(people.delete(_))
        .unsafeRunSync()
        .getOrElse(null)

    result shouldEqual person

    val resultAfterDelete =
      people.run(_.find(Filter.eq("_id", person._id)).first).unsafeRunSync()

    resultAfterDelete shouldEqual None
  }

  it should "drop a collection" in {
    people.drop.unsafeRunSync()
  }
}
