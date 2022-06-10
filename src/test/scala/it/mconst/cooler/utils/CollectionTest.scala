package it.mconst.cooler.utils

import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions
import munit.CatsEffectSuite

import cats.effect.IO
import cats.effect.Resource
import cats.effect.unsafe.implicits.global
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.CursorQueryAsc
import it.mconst.cooler.models.CursorQueryDesc
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.operations.Filter
import mongo4cats.collection.operations.Update
import cats.data.EitherT
import org.http4s.Status
import org.bson.BsonDateTime

class CollectionTest extends CatsEffectSuite {
  given Lang = Lang.Default
  given Assertions = this

  case class Person(
      _id: ObjectId,
      firstName: String,
      lastName: String,
      createdAt: BsonDateTime = BsonDateTime(System.currentTimeMillis),
      updatedAt: BsonDateTime = BsonDateTime(System.currentTimeMillis)
  ) extends DbDocument

  val people = Collection[IO, Person]("people")

  val dropFixture =
    ResourceSuiteLocalFixture(
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
        peopleData.map(c.create(_).orFail).parSequence
      }
    }
  }(_ => people.use(_.raw(_.deleteMany(Filter.empty).void)))

  override val munitFixtures = List(dropFixture)

  test("should create a document") {
    val person = Person(new ObjectId(), "John", "Doe")
    people.use(_.create(person).value).assertEquals(Right(person))
  }

  test("should update a document") {
    val person = Person(new ObjectId(), "John", "Doe")
    val update = Update.set("firstName", "Mario").set("lastName", "Martino")

    for
      update <- EitherT(
        people
          .use(_.create(person).value)
      ).orFail
        .flatMap(person =>
          EitherT(people.use(_.update(person._id, update).value)).orFail
        )
      _ = assertEquals(update.firstName, "Mario")
      _ = assertEquals(update.lastName, "Martino")
    yield ()
  }

  test("should delete a document") {
    val person = Person(new ObjectId(), "John", "Doe")

    for
      _ <- EitherT(people.use(_.create(person).value)).value
      result <- EitherT(people.use(_.delete(person._id).value)).value
        .assertEquals(Right(person))
      _ <- EitherT(
        people
          .use(_.findOne(Filter.eq("_id", person._id)).value)
      ).value
        .assertEquals(Left(Error(Status.NotFound, __.ErrorDocumentNotFound)))
    yield ()
  }

  test("should find a document") {
    peopleList.use { peopleData =>
      for
        result <- EitherT(
          people
            .use(
              _.find("firstName", Seq.empty)(
                CursorQueryAsc(query = Some("a"))
              ).value
            )
        ).orFail
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
        result <- EitherT(
          people
            .use(
              _.find("firstName", Seq.empty)(
                CursorQueryAsc(query = Some("sd"), first = Some(2))
              ).value
            )
        ).orFail
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
        result <- EitherT(
          people
            .use(
              _.find("firstName", Seq.empty)(
                CursorQueryAsc(
                  query = Some("sd"),
                  first = Some(2),
                  after = Some("Bsd")
                )
              ).value
            )
        ).orFail
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
        result <- EitherT(
          people
            .use(
              _.find("firstName", Seq.empty)(
                CursorQueryAsc(
                  query = Some("sd"),
                  first = Some(2),
                  after = Some("Dsd")
                )
              ).value
            )
        ).orFail
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
        result <- EitherT(
          people
            .use(
              _.find("firstName", Seq.empty)(
                CursorQueryDesc(query = Some("sd"), last = Some(2))
              ).value
            )
        ).orFail
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
        result <- EitherT(
          people
            .use(
              _.find("firstName", Seq.empty)(
                CursorQueryDesc(
                  query = Some("sd"),
                  last = Some(2),
                  before = Some("Esd")
                )
              ).value
            )
        ).orFail
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
        result <- EitherT(
          people
            .use(
              _.find("firstName", Seq.empty)(
                CursorQueryDesc(
                  query = Some("sd"),
                  last = Some(2),
                  before = Some("Csd")
                )
              ).value
            )
        ).orFail
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
