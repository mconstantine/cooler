package it.mconst.cooler.routes

import it.mconst.cooler.utils.IOSuite
import it.mconst.cooler.utils.TestUtils.*
import munit.Assertions

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.generic.auto.*
import it.mconst.cooler.middlewares.UserMiddleware
import it.mconst.cooler.models.*
import it.mconst.cooler.models.client.BusinessClientType
import it.mconst.cooler.models.client.Client
import it.mconst.cooler.models.client.Clients
import it.mconst.cooler.models.user.User
import it.mconst.cooler.models.user.Users
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Error
import mongo4cats.collection.operations.Filter
import org.http4s.circe.*
import org.http4s.client.{Client as HttpClient}
import org.http4s.client.dsl.io.*
import org.http4s.dsl.io.*
import org.http4s.EntityDecoder
import org.http4s.implicits.*
import org.http4s.Uri

class ClientRoutesTest extends IOSuite {
  val app = ClientRoutes().orNotFound
  val client: HttpClient[IO] = HttpClient.fromHttpApp(app)

  given Lang = Lang.Default
  given HttpClient[IO] = client

  val adminFixture = IOFixture(
    "admin",
    Resource.make {
      given Option[User] = none[User]

      Users
        .create(
          User.CreationData(
            "Client routes test admin",
            "client-routes-test-admin@example.com",
            "S0m3P4ssw0rd!?"
          )
        )
        .orFail
    }(_ =>
      Users.collection.use(_.drop).both(Clients.collection.use(_.drop)).void
    )
  )

  override val munitFixtures = List(adminFixture)

  test("should create a client") {
    val data =
      makeTestBusinessClient(addressEmail = "create-test@example.com")

    POST(data, uri"/")
      .sign(adminFixture())
      .shouldRespondLike(
        (c: Client) => c.asBusiness.addressEmail,
        data.addressEmail
      )
  }

  def clientsList = Resource.make {
    val clients = List(
      makeTestPrivateClient(firstName = "A", lastName = "A"),
      makeTestPrivateClient(firstName = "B", lastName = "B"),
      makeTestPrivateClient(firstName = "C", lastName = "D"),
      makeTestBusinessClient(businessName = "D D"),
      makeTestBusinessClient(businessName = "E E"),
      makeTestBusinessClient(businessName = "F F")
    )

    import cats.syntax.parallel.*
    given User = adminFixture()

    Clients.collection
      .use(_.raw(_.deleteMany(Filter.empty)))
      .flatMap(_ => clients.map(Clients.create(_).orFail).parSequence)
  }(_ => Clients.collection.use(_.raw(_.deleteMany(Filter.empty)).void))

  test("should find clients (asc)") {
    clientsList.use { clients =>
      given EntityDecoder[IO, Cursor[Client]] = jsonOf[IO, Cursor[Client]]

      GET(uri"/?query=d&first=1&after=C%20D")
        .sign(adminFixture())
        .shouldRespond(
          Cursor[Client](
            PageInfo(2, Some("D D"), Some("D D"), true, false),
            List(Edge(clients(3), "D D"))
          )
        )
    }
  }

  test("should find clients (desc)") {
    clientsList.use { clients =>
      given EntityDecoder[IO, Cursor[Client]] = jsonOf[IO, Cursor[Client]]

      GET(uri"/?query=d&last=1&before=D%20D")
        .sign(adminFixture())
        .shouldRespond(
          Cursor[Client](
            PageInfo(2, Some("C D"), Some("C D"), true, false),
            List(Edge(clients(2), "C D"))
          )
        )
    }
  }

  test("should find a client by id") {
    val admin = adminFixture()
    val data =
      makeTestPrivateClient(addressEmail = "find-by-id-test@example.com")

    given User = admin

    for
      client <- Clients.create(data).orFail
      _ <- GET(Uri.fromString(s"/${client._id.toString}").getOrElse(fail("")))
        .sign(admin)
        .shouldRespondLike(
          (c: Client) => c.asPrivate.addressEmail,
          data.addressEmail
        )
    yield ()
  }

  test("should update a client") {
    val admin = adminFixture()

    val clientData =
      makeTestPrivateClient(addressEmail = "update-route-test@example.com")

    val updateData =
      makeTestBusinessClient(addressEmail = "updated-through-route@example.com")

    given User = admin

    for
      c <- Clients.create(clientData).orFail
      result <- client
        .expect[Client](
          PUT(
            updateData,
            Uri.fromString(s"/${c._id.toString}").getOrElse(fail(""))
          )
            .sign(admin)
        )
        .map(_.asBusiness)
      _ = assertEquals(result.addressEmail.toString, updateData.addressEmail)
      _ = assertEquals(result.`type`, BusinessClientType.value)
    yield ()
  }

  test("should delete a client") {
    val admin = adminFixture()

    val clientData =
      makeTestBusinessClient(addressEmail = "delete-route-test@example.com")

    given User = admin

    for
      client <- Clients.create(clientData).orFail
      _ <- DELETE(
        Uri.fromString(s"/${client._id.toString}").getOrElse(fail(""))
      )
        .sign(admin)
        .shouldRespondLike(
          (c: Client) => c.asBusiness.addressEmail,
          clientData.addressEmail
        )
      _ <- Clients
        .findById(client.asBusiness._id)
        .assertEquals(Left(Error(NotFound, __.ErrorClientNotFound)))
    yield ()
  }
}
