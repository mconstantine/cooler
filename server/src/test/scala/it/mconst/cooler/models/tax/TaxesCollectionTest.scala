package it.mconst.cooler.models.tax

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import cats.syntax.parallel.*
import com.mongodb.client.model.Filters
import com.osinka.i18n.Lang
import it.mconst.cooler.models.*
import it.mconst.cooler.models.CursorQueryAsc
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import org.http4s.Status

class TaxesCollectionTest extends IOSuite {
  given Lang = Lang.Default
  given Assertions = this

  val adminFixture = IOFixture(
    "admin",
    Resource.make {
      given Option[User] = none[User]

      Users
        .create(
          User.CreationData(
            "Taxes collection test admin",
            "taxes-collection-test-admin@example.com",
            "S0m3P4ssw0rd!"
          )
        )
        .orFail
    }(_ =>
      Users.collection.use(
        _.raw(_.deleteMany(Filters.empty))
          .both(Taxes.collection.use(_.raw(_.deleteMany(Filters.empty))))
          .void
      )
    )
  )

  override def munitFixtures = Seq(adminFixture)

  given User = adminFixture()

  test("should create a tax") {
    val data = makeTestTax("Tax creation test", 0.01)

    for
      tax <- Taxes.create(data).orFail
      _ = assertEquals(tax.label.toString, data.label)
      _ = assertEquals(tax.value.toNumber, data.value)
      _ = assertEquals(tax.user, adminFixture()._id)
    yield ()
  }

  def taxesList = Resource.make(
    Taxes.collection
      .use(_.raw(_.deleteMany(Filters.empty)))
      .flatMap(_ =>
        List(
          makeTestTax("Tax A", 0.1),
          makeTestTax("Tax B", 0.2),
          makeTestTax("Tax C", 0.3),
          makeTestTax("Tax D", 0.4),
          makeTestTax("Tax E", 0.5),
          makeTestTax("Tax F", 0.6),
          makeTestTax("Some other label", 0.666)
        ).map(Taxes.create(_).orFail).parSequence
      )
  )(taxes => Taxes.collection.use(_.raw(_.deleteMany(Filters.empty)).void))

  test("should find taxes (asc)") {
    taxesList.use(taxes =>
      Taxes
        .find(
          CursorQueryAsc(
            Some("tax"),
            Some(PositiveInteger.unsafe(2)),
            Some("Tax B")
          )
        )
        .orFail
        .assertEquals(
          Cursor[Tax](
            PageInfo(6, Some("Tax C"), Some("Tax D"), true, true),
            taxes.slice(2, 4).map(tax => Edge(tax, tax.label.toString))
          )
        )
    )
  }

  test("should find taxes (desc)") {
    taxesList.use(taxes =>
      Taxes
        .find(
          CursorQueryDesc(
            Some("tax"),
            Some(PositiveInteger.unsafe(2)),
            Some("Tax E")
          )
        )
        .orFail
        .assertEquals(
          Cursor[Tax](
            PageInfo(6, Some("Tax D"), Some("Tax C"), true, true),
            taxes.reverse.slice(3, 5).map(tax => Edge(tax, tax.label.toString))
          )
        )
    )
  }

  def otherUser = Resource.make {
    given Option[User] = Some(adminFixture())
    Users
      .create(
        User.CreationData(
          "Other user",
          "other-user@example.com",
          "S0m3Oth3rP4ssw0rd!"
        )
      )
      .orFail
  }(user =>
    Users.collection.use(_.raw(_.deleteOne(Filters.eq("_id", user._id)))).void
  )

  test("should not find taxes of other users") {
    taxesList.use(_ =>
      otherUser.use { otherUser =>
        given User = otherUser

        Taxes
          .find(
            CursorQueryAsc(none[String], none[PositiveInteger], none[String])
          )
          .orFail
          .assertEquals(
            Cursor[Tax](
              PageInfo(0, none[String], none[String], false, false),
              List.empty
            )
          )
      }
    )
  }

  test("should update a tax") {
    val data = makeTestTax("Update test", 0.24)
    val updateData = makeTestTax("Updated", 0.42)

    for
      tax <- Taxes.create(data).orFail
      updated <- Taxes.update(tax._id, updateData).orFail
      _ = assertEquals(updated.label.toString, updateData.label)
      _ = assertEquals(updated.value.toNumber, updateData.value)
    yield ()
  }

  test("should not update a tax of another user") {
    otherUser.use { otherUser =>
      val data = makeTestTax("Update exclusivity test", 0.42)

      for
        tax <- Taxes.create(data).orFail
        _ <- {
          given User = otherUser
          Taxes
            .update(tax._id, makeTestTax())
            .assertEquals(Left(Error(Status.NotFound, __.ErrorTaxNotFound)))
        }
      yield ()
    }
  }

  test("should delete a tax") {
    val data = makeTestTax("Deletion test", 0.1)

    for
      tax <- Taxes.create(data).orFail
      _ <- Taxes.delete(tax._id).orFail.assertEquals(tax)
      _ <- Taxes
        .find(
          CursorQueryAsc(
            none[String],
            Some(PositiveInteger.unsafe(1000000)),
            none[String]
          )
        )
        .orFail
        .map(_.edges.map(_.node._id).contains(tax._id))
        .assertEquals(false)
    yield ()
  }

  test("should not delete a tax of another user") {
    otherUser.use { otherUser =>
      for
        tax <- Taxes.create(makeTestTax()).orFail
        _ <- {
          given User = otherUser
          Taxes
            .delete(tax._id)
            .assertEquals(Left(Error(Status.NotFound, __.ErrorTaxNotFound)))
        }
      yield ()
    }
  }
}
