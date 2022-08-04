package it.mconst.cooler.routes

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.models.*
import it.mconst.cooler.models.tax.Tax
import it.mconst.cooler.models.tax.Taxes
import it.mconst.cooler.models.tax.toBigDecimal
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.given
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.http4s.circe.*
import org.http4s.client.{Client as HttpClient}
import org.http4s.client.dsl.io.*
import org.http4s.dsl.io.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import org.http4s.implicits.*
import org.http4s.syntax.*
import org.http4s.Uri

class TaxRoutesTest extends IOSuite {
  val app = TaxRoutes().orNotFound
  val client: HttpClient[IO] = HttpClient.fromHttpApp(app)

  given Lang = Lang.Default
  given Assertions = this
  given HttpClient[IO] = client

  given EntityDecoder[IO, Tax] = jsonOf[IO, Tax]

  val adminFixture = IOFixture(
    "admin",
    Resource.make {
      given Option[User] = none[User]

      Users
        .create(
          User.CreationData(
            "Tax routes test admin",
            "tax-routes-test-admin@example.com",
            "S0m3P4ssw0rd!"
          )
        )
        .orFail
    }(_ => Users.collection.use(_.drop).both(Taxes.collection.use(_.drop)).void)
  )

  override val munitFixtures = List(adminFixture)

  test("should create a tax") {
    val data = makeTestTax("Creation route test")

    POST(data, uri"/")
      .sign(adminFixture())
      .shouldRespondLike((t: Tax) => t.label, data.label)
  }

  def taxesList = Resource.make {
    val taxes = List(
      makeTestTax("Tax A", 0.1),
      makeTestTax("Tax B", 0.2),
      makeTestTax("Tax C", 0.3),
      makeTestTax("Tax D", 0.4),
      makeTestTax("Tax E", 0.5),
      makeTestTax("Tax F", 0.6),
      makeTestTax("Some other label", 0.666)
    )

    import cats.syntax.parallel.*
    given User = adminFixture()

    Taxes.collection
      .use(_.raw(_.deleteMany(Filter.empty)))
      .flatMap(_ => taxes.map(Taxes.create(_).orFail).parSequence)
  }(_ => Taxes.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find taxes (asc)") {
    taxesList.use { taxes =>
      given EntityEncoder[IO, Cursor[Tax]] = jsonEncoderOf[IO, Cursor[Tax]]

      GET(uri"/?query=tax&first=2&after=Tax%20B")
        .sign(adminFixture())
        .shouldRespond(
          Cursor[Tax](
            PageInfo(6, Some("Tax C"), Some("Tax D"), true, true),
            List(Edge(taxes(2), "Tax C"), Edge(taxes(3), "Tax D"))
          )
        )
    }
  }

  test("should find taxes (desc)") {
    taxesList.use { taxes =>
      given EntityEncoder[IO, Cursor[Tax]] = jsonEncoderOf[IO, Cursor[Tax]]

      GET(uri"/?query=tax&last=2&before=Tax%20E")
        .sign(adminFixture())
        .shouldRespond(
          Cursor[Tax](
            PageInfo(6, Some("Tax D"), Some("Tax C"), true, true),
            List(Edge(taxes(3), "Tax D"), Edge(taxes(2), "Tax C"))
          )
        )
    }
  }

  test("should update a session") {
    val user = adminFixture()

    val originalData = makeTestTax("Tax update route test", 0.24)
    val updateData = makeTestTax("Updated", 0.42)

    given User = user

    for
      tax <- Taxes.create(originalData).orFail
      result <- client
        .expect[Tax](
          PUT(
            updateData,
            Uri.fromString(s"/${tax._id.toString}").getOrElse(fail(""))
          ).sign(user)
        )
      _ = assertEquals(result.label.toString, updateData.label)
      _ = assertEquals(result.value.toBigDecimal, updateData.value)
    yield ()
  }

  test("should delete a tax") {
    val user = adminFixture()
    val data = makeTestTax("Deletion route test")

    given User = user

    for
      tax <- Taxes.create(data).orFail
      _ <- DELETE(
        Uri.fromString(s"/${tax._id.toString}").getOrElse(fail(""))
      )
        .sign(user)
        .shouldRespond(tax)
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
}
