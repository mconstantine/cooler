package it.mconst.cooler.utils

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.data.EitherT
import cats.effect.IO
import cats.effect.Resource
import cats.effect.unsafe.implicits.global
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.CursorQueryAsc
import it.mconst.cooler.models.CursorQueryDesc
import it.mconst.cooler.models.PositiveInteger
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.Status

class CollectionTest extends IOSuite {
  given Lang = Lang.Default

  final case class Person(
      _id: ObjectId,
      firstName: String,
      lastName: String,
      createdAt: BsonDateTime = BsonDateTime(System.currentTimeMillis),
      updatedAt: BsonDateTime = BsonDateTime(System.currentTimeMillis)
  ) extends DbDocument

  final case class PersonInputData(firstName: String, lastName: String)

  val people = Collection[IO, PersonInputData, Person]("people")

  val dropFixture = IOFixture(
    "drop",
    Resource.make(IO.unit)(_ => people.use(_.drop))
  )

  val peopleList = Resource.make {
    val peopleData: List[Person] = List(
      Person(ObjectId(), "Asd", ""),
      Person(ObjectId(), "Bsd", ""),
      Person(ObjectId(), "Csd", ""),
      Person(ObjectId(), "Dsd", ""),
      Person(ObjectId(), "Esd", ""),
      Person(ObjectId(), "Fsd", ""),
      Person(ObjectId(), "ZZZ", "")
    )

    import cats.syntax.parallel.*

    people.use { c =>
      c.raw(_.deleteMany(Filter.empty)).flatMap { _ =>
        peopleData.map(c.createAndReturn(_).orFail).parSequence
      }
    }
  }(_ => people.use(_.raw(_.deleteMany(Filter.empty).void)))

  override val munitFixtures = List(dropFixture)

  test("should create a document") {
    val person = Person(new ObjectId(), "John", "Doe")
    people.use(_.createAndReturn(person)).assertEquals(Right(person))
  }

  test("should update a document") {
    val data = Person(new ObjectId(), "John", "Doe")

    val updates = Collection.Update
      .`with`("firstName" -> "Mario")
      .`with`("lastName" -> "Martino")
      .build

    people.use { c =>
      for
        person <- c.createAndReturn(data)
        _ <- c.update(person._id, updates)
        update <- c.findOne[Person](Filter.eq("_id", person._id))
        _ = assertEquals(update.firstName, "Mario")
        _ = assertEquals(update.lastName, "Martino")
      yield ()
    }
  }

  test("should register the time of the update") {
    val data = Person(new ObjectId(), "John", "Doe")

    val updates = Collection.Update
      .`with`("firstName" -> "Mario")
      .`with`("lastName" -> "Martino")
      .build

    people.use { c =>
      for
        person <- c.createAndReturn(data).orFail
        _ <- IO.delay(500)
        _ <- c.update(person._id, updates).orFail
        updated <- c.findOne[Person](Filter.eq("_id", person._id)).orFail
        _ = assert(updated.updatedAt.getValue > person.updatedAt.getValue)
      yield ()
    }
  }

  test("should delete a document") {
    val person = Person(new ObjectId(), "John", "Doe")

    people.use { c =>
      for
        _ <- c.create(person).orFail
        _ <- c.delete(person._id).orFail
        _ <- c
          .findOne[Person](Filter.eq("_id", person._id))
          .assertEquals(Left(Error(Status.NotFound, __.ErrorDocumentNotFound)))
      yield ()
    }
  }

  test("should find a document") {
    peopleList.use { peopleData =>
      for
        result <- people
          .use(
            _.find[Person]("firstName", Seq.empty)(
              CursorQueryAsc(query = Some("a"))
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 1)
        _ = assertEquals(result.pageInfo.startCursor, Some("Asd"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Asd"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, false)
        _ = assertEquals(result.pageInfo.hasNextPage, false)
        _ = assertEquals(result.edges.map(_.node), List(peopleData(0)))
      yield ()
    }
  }

  test("should paginate a document (first page, asc)") {
    peopleList.use { peopleData =>
      for
        result <- people
          .use(
            _.find[Person]("firstName", Seq.empty)(
              CursorQueryAsc(
                query = Some("sd"),
                first = Some(PositiveInteger.unsafe(2))
              )
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 6)
        _ = assertEquals(result.pageInfo.startCursor, Some("Asd"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Bsd"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, false)
        _ = assertEquals(result.pageInfo.hasNextPage, true)
        _ = assertEquals(result.edges.map(_.node), peopleData.slice(0, 2))
      yield ()
    }
  }

  test("should paginate a document (nth page, asc)") {
    peopleList.use { peopleData =>
      for
        result <- people
          .use(
            _.find[Person]("firstName", Seq.empty)(
              CursorQueryAsc(
                query = Some("sd"),
                first = Some(PositiveInteger.unsafe(2)),
                after = Some("Bsd")
              )
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 6)
        _ = assertEquals(result.pageInfo.startCursor, Some("Csd"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Dsd"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, true)
        _ = assertEquals(result.pageInfo.hasNextPage, true)
        _ = assertEquals(result.edges.map(_.node), peopleData.slice(2, 4))
      yield ()
    }
  }

  test("should paginate a document (last page, asc)") {
    peopleList.use { peopleData =>
      for
        result <- people
          .use(
            _.find[Person]("firstName", Seq.empty)(
              CursorQueryAsc(
                query = Some("sd"),
                first = Some(PositiveInteger.unsafe(2)),
                after = Some("Dsd")
              )
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 6)
        _ = assertEquals(result.pageInfo.startCursor, Some("Esd"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Fsd"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, true)
        _ = assertEquals(result.pageInfo.hasNextPage, false)
        _ = assertEquals(result.edges.map(_.node), peopleData.slice(4, 6))
      yield ()
    }
  }

  test("should paginate a document (first page, desc)") {
    peopleList.use { peopleData =>
      for
        result <- people
          .use(
            _.find[Person]("firstName", Seq.empty)(
              CursorQueryDesc(
                query = Some("sd"),
                last = Some(PositiveInteger.unsafe(2))
              )
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 6)
        _ = assertEquals(result.pageInfo.startCursor, Some("Fsd"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Esd"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, false)
        _ = assertEquals(result.pageInfo.hasNextPage, true)
        _ = assertEquals(
          result.edges.map(_.node),
          peopleData.reverse.slice(1, 3)
        )
      yield ()
    }
  }

  test("should paginate a document (nth page, desc)") {
    peopleList.use { peopleData =>
      for
        result <- people
          .use(
            _.find[Person]("firstName", Seq.empty)(
              CursorQueryDesc(
                query = Some("sd"),
                last = Some(PositiveInteger.unsafe(2)),
                before = Some("Esd")
              )
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 6)
        _ = assertEquals(result.pageInfo.startCursor, Some("Dsd"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Csd"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, true)
        _ = assertEquals(result.pageInfo.hasNextPage, true)
        _ = assertEquals(
          result.edges.map(_.node),
          peopleData.reverse.slice(3, 5)
        )
      yield ()
    }
  }

  test("should paginate a document (last page, desc)") {
    peopleList.use { peopleData =>
      for
        result <- people
          .use(
            _.find[Person]("firstName", Seq.empty)(
              CursorQueryDesc(
                query = Some("sd"),
                last = Some(PositiveInteger.unsafe(2)),
                before = Some("Csd")
              )
            )
          )
          .orFail
        _ = assertEquals(result.pageInfo.totalCount, 6)
        _ = assertEquals(result.pageInfo.startCursor, Some("Bsd"))
        _ = assertEquals(result.pageInfo.endCursor, Some("Asd"))
        _ = assertEquals(result.pageInfo.hasPreviousPage, true)
        _ = assertEquals(result.pageInfo.hasNextPage, false)
        _ = assertEquals(
          result.edges.map(_.node),
          peopleData.reverse.slice(5, 7)
        )
      yield ()
    }
  }
}
