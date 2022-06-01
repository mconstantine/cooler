package it.mconst.cooler.models

import cats.effect.IO
import cats.syntax.apply._
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.BsonField
import com.mongodb.client.model.Facet
import com.mongodb.client.model.Field
import com.mongodb.client.model.Filters
import com.mongodb.client.model.Updates
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto._
import io.circe.HCursor
import io.circe.Json
import io.circe.syntax._
import it.mconst.cooler.models.Client.PrivateUpdateData
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.Config
import it.mconst.cooler.utils.Document
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import it.mconst.cooler.utils.Result._
import it.mconst.cooler.utils.Timestamps
import mongo4cats.bson.Document as Doc
import mongo4cats.bson.ObjectId
import mongo4cats.circe._
import mongo4cats.codecs.MongoCodecProvider
import mongo4cats.collection.operations.Filter
import munit.Assertions
import org.bson.BsonDateTime
import org.http4s.circe._
import org.http4s.dsl.io._
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import scala.collection.JavaConverters._

abstract trait Client(
    _id: ObjectId,
    addressCountry: CountryCode,
    addressProvince: ProvinceCode,
    addressZIP: NonEmptyString,
    addressCity: NonEmptyString,
    addressStreet: NonEmptyString,
    addressStreetNumber: Option[NonEmptyString],
    addressEmail: Email,
    user: ObjectId,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Document
    with Timestamps {
  def name: String
}

case class PrivateClient(
    _id: ObjectId,
    fiscalCode: NonEmptyString,
    firstName: NonEmptyString,
    lastName: NonEmptyString,
    addressCountry: CountryCode,
    addressProvince: ProvinceCode,
    addressZIP: NonEmptyString,
    addressCity: NonEmptyString,
    addressStreet: NonEmptyString,
    addressStreetNumber: Option[NonEmptyString],
    addressEmail: Email,
    user: ObjectId,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Client(
      _id,
      addressCountry,
      addressProvince,
      addressZIP,
      addressCity,
      addressStreet,
      addressStreetNumber,
      addressEmail,
      user,
      createdAt,
      updatedAt
    ) {
  override def name: String = s"$firstName $lastName"
}

case class BusinessClient(
    _id: ObjectId,
    countryCode: CountryCode,
    businessName: NonEmptyString,
    vatNumber: NonEmptyString,
    addressCountry: CountryCode,
    addressProvince: ProvinceCode,
    addressZIP: NonEmptyString,
    addressCity: NonEmptyString,
    addressStreet: NonEmptyString,
    addressStreetNumber: Option[NonEmptyString],
    addressEmail: Email,
    user: ObjectId,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends Client(
      _id,
      addressCountry,
      addressProvince,
      addressZIP,
      addressCity,
      addressStreet,
      addressStreetNumber,
      addressEmail,
      user,
      createdAt,
      updatedAt
    ) {
  override def name: String = s"$businessName"
}

object Client {
  abstract trait CreationData(
      addressCountry: String,
      addressProvince: String,
      addressZIP: String,
      addressCity: String,
      addressStreet: String,
      addressStreetNumber: Option[String],
      addressEmail: String
  ) {
    def name: String
  }

  case class PrivateCreationData(
      fiscalCode: String,
      firstName: String,
      lastName: String,
      addressCountry: String,
      addressProvince: String,
      addressZIP: String,
      addressCity: String,
      addressStreet: String,
      addressStreetNumber: Option[String],
      addressEmail: String
  ) extends CreationData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      ) {
    override def name = s"${firstName} ${lastName}"
  }

  case class BusinessCreationData(
      countryCode: String,
      businessName: String,
      vatNumber: String,
      addressCountry: String,
      addressProvince: String,
      addressZIP: String,
      addressCity: String,
      addressStreet: String,
      addressStreetNumber: Option[String],
      addressEmail: String
  ) extends CreationData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      ) {
    override def name = businessName
  }

  given Encoder[CreationData] with Decoder[CreationData] with {
    override def apply(client: CreationData): Json = client match
      case privateCreationData: PrivateCreationData =>
        privateCreationData.asJson
      case businessCreationData: BusinessCreationData =>
        businessCreationData.asJson

    override def apply(c: HCursor): Decoder.Result[CreationData] =
      c.as[BusinessCreationData]
        .orElse[DecodingFailure, CreationData](c.as[PrivateCreationData])
  }

  given EntityEncoder[IO, PrivateCreationData] =
    jsonEncoderOf[IO, PrivateCreationData]

  given EntityDecoder[IO, PrivateCreationData] = jsonOf[IO, PrivateCreationData]

  given EntityEncoder[IO, BusinessCreationData] =
    jsonEncoderOf[IO, BusinessCreationData]

  given EntityDecoder[IO, BusinessCreationData] =
    jsonOf[IO, BusinessCreationData]

  given EntityEncoder[IO, CreationData] = jsonEncoderOf[IO, CreationData]
  given EntityDecoder[IO, CreationData] = jsonOf[IO, CreationData]

  abstract trait ValidCreationData(
      addressCountry: CountryCode,
      addressProvince: ProvinceCode,
      addressZIP: NonEmptyString,
      addressCity: NonEmptyString,
      addressStreet: NonEmptyString,
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Email
  )

  case class ValidPrivateCreationData(
      fiscalCode: NonEmptyString,
      firstName: NonEmptyString,
      lastName: NonEmptyString,
      addressCountry: CountryCode,
      addressProvince: ProvinceCode,
      addressZIP: NonEmptyString,
      addressCity: NonEmptyString,
      addressStreet: NonEmptyString,
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Email
  ) extends ValidCreationData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  case class ValidBusinessCreationData(
      countryCode: CountryCode,
      businessName: NonEmptyString,
      vatNumber: NonEmptyString,
      addressCountry: CountryCode,
      addressProvince: ProvinceCode,
      addressZIP: NonEmptyString,
      addressCity: NonEmptyString,
      addressStreet: NonEmptyString,
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Email
  ) extends ValidCreationData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  abstract trait UpdateData(
      addressCountry: Option[String],
      addressProvince: Option[String],
      addressZIP: Option[String],
      addressCity: Option[String],
      addressStreet: Option[String],
      addressStreetNumber: Option[String],
      addressEmail: Option[String]
  )

  case class PrivateUpdateData(
      fiscalCode: Option[String] = None,
      firstName: Option[String] = None,
      lastName: Option[String] = None,
      addressCountry: Option[String] = None,
      addressProvince: Option[String] = None,
      addressZIP: Option[String] = None,
      addressCity: Option[String] = None,
      addressStreet: Option[String] = None,
      addressStreetNumber: Option[String] = None,
      addressEmail: Option[String] = None
  ) extends UpdateData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  case class BusinessUpdateData(
      countryCode: Option[String] = None,
      businessName: Option[String] = None,
      vatNumber: Option[String] = None,
      addressCountry: Option[String] = None,
      addressProvince: Option[String] = None,
      addressZIP: Option[String] = None,
      addressCity: Option[String] = None,
      addressStreet: Option[String] = None,
      addressStreetNumber: Option[String] = None,
      addressEmail: Option[String] = None
  ) extends UpdateData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  given Encoder[UpdateData] with Decoder[UpdateData] with {
    override def apply(client: UpdateData): Json = client match
      case privateUpdateData: PrivateUpdateData =>
        privateUpdateData.asJson
      case businessUpdateData: BusinessUpdateData =>
        businessUpdateData.asJson

    override def apply(c: HCursor): Decoder.Result[UpdateData] =
      c.as[BusinessUpdateData]
        .orElse[DecodingFailure, UpdateData](c.as[PrivateUpdateData])
  }

  given EntityEncoder[IO, UpdateData] = jsonEncoderOf[IO, UpdateData]
  given EntityDecoder[IO, UpdateData] = jsonOf[IO, UpdateData]

  abstract trait ValidUpdateData(
      addressCountry: Option[CountryCode],
      addressProvince: Option[ProvinceCode],
      addressZIP: Option[NonEmptyString],
      addressCity: Option[NonEmptyString],
      addressStreet: Option[NonEmptyString],
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Option[Email]
  )

  case class ValidPrivateUpdateData(
      fiscalCode: Option[NonEmptyString],
      firstName: Option[NonEmptyString],
      lastName: Option[NonEmptyString],
      addressCountry: Option[CountryCode],
      addressProvince: Option[ProvinceCode],
      addressZIP: Option[NonEmptyString],
      addressCity: Option[NonEmptyString],
      addressStreet: Option[NonEmptyString],
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Option[Email]
  ) extends ValidUpdateData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  case class ValidBusinessUpdateData(
      countryCode: Option[CountryCode],
      businessName: Option[NonEmptyString],
      vatNumber: Option[NonEmptyString],
      addressCountry: Option[CountryCode],
      addressProvince: Option[ProvinceCode],
      addressZIP: Option[NonEmptyString],
      addressCity: Option[NonEmptyString],
      addressStreet: Option[NonEmptyString],
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Option[Email]
  ) extends ValidUpdateData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  def validateCreationData(data: CreationData)(using
      Lang
  ): Validation[ValidCreationData] = data match
    case d: PrivateCreationData =>
      (
        NonEmptyString.validate("fiscalCode", d.fiscalCode),
        NonEmptyString.validate("firstName", d.firstName),
        NonEmptyString.validate("lastName", d.lastName),
        CountryCode.validate("addressCountry", d.addressCountry),
        ProvinceCode.validate("addressProvince", d.addressProvince),
        NonEmptyString.validate("addressZIP", d.addressZIP),
        NonEmptyString.validate("addressCity", d.addressCity),
        NonEmptyString.validate("addressStreet", d.addressStreet),
        NonEmptyString.validateOptional(
          "addressStreetNumber",
          d.addressStreetNumber
        ),
        Email.validate("addressEmail", d.addressEmail)
      ).mapN(
        (
            fiscalCode,
            firstName,
            lastName,
            addressCountry,
            addressProvince,
            addressZIP,
            addressCity,
            addressStreet,
            addressStreetNumber,
            addressEmail
        ) =>
          ValidPrivateCreationData(
            fiscalCode,
            firstName,
            lastName,
            addressCountry,
            addressProvince,
            addressZIP,
            addressCity,
            addressStreet,
            addressStreetNumber,
            addressEmail
          )
      )
    case d: BusinessCreationData =>
      (
        CountryCode.validate("countryCode", d.countryCode),
        NonEmptyString.validate("businessName", d.businessName),
        NonEmptyString.validate("vatNumber", d.vatNumber),
        CountryCode.validate("addressCountry", d.addressCountry),
        ProvinceCode.validate("addressProvince", d.addressProvince),
        NonEmptyString.validate("addressZIP", d.addressZIP),
        NonEmptyString.validate("addressCity", d.addressCity),
        NonEmptyString.validate("addressStreet", d.addressStreet),
        NonEmptyString.validateOptional(
          "addressStreetNumber",
          d.addressStreetNumber
        ),
        Email.validate("addressEmail", d.addressEmail)
      ).mapN(
        (
            countryCode,
            businessName,
            vatNumber,
            addressCountry,
            addressProvince,
            addressZIP,
            addressCity,
            addressStreet,
            addressStreetNumber,
            addressEmail
        ) =>
          ValidBusinessCreationData(
            countryCode,
            businessName,
            vatNumber,
            addressCountry,
            addressProvince,
            addressZIP,
            addressCity,
            addressStreet,
            addressStreetNumber,
            addressEmail
          )
      )

  def validateUpdateData(data: UpdateData)(using
      Lang
  ): Validation[ValidUpdateData] = data match
    case d: PrivateUpdateData =>
      (
        NonEmptyString.validateOptional("fiscalCode", d.fiscalCode),
        NonEmptyString.validateOptional("firstName", d.firstName),
        NonEmptyString.validateOptional("lastName", d.lastName),
        CountryCode.validateOptional("addressCountry", d.addressCountry),
        ProvinceCode.validateOptional("addressProvince", d.addressProvince),
        NonEmptyString.validateOptional("addressZIP", d.addressZIP),
        NonEmptyString.validateOptional("addressCity", d.addressCity),
        NonEmptyString.validateOptional("addressStreet", d.addressStreet),
        NonEmptyString.validateOptional(
          "addressStreetNumber",
          d.addressStreetNumber
        ),
        Email.validateOptional("addressEmail", d.addressEmail)
      ).mapN(
        (
            fiscalCode,
            firstName,
            lastName,
            addressCountry,
            addressProvince,
            addressZIP,
            addressCity,
            addressStreet,
            addressStreetNumber,
            addressEmail
        ) =>
          ValidPrivateUpdateData(
            fiscalCode,
            firstName,
            lastName,
            addressCountry,
            addressProvince,
            addressZIP,
            addressCity,
            addressStreet,
            addressStreetNumber,
            addressEmail
          )
      )
    case d: BusinessUpdateData =>
      (
        CountryCode.validateOptional("countryCode", d.countryCode),
        NonEmptyString.validateOptional("businessName", d.businessName),
        NonEmptyString.validateOptional("vatNumber", d.vatNumber),
        CountryCode.validateOptional("addressCountry", d.addressCountry),
        ProvinceCode.validateOptional("addressProvince", d.addressProvince),
        NonEmptyString.validateOptional("addressZIP", d.addressZIP),
        NonEmptyString.validateOptional("addressCity", d.addressCity),
        NonEmptyString.validateOptional("addressStreet", d.addressStreet),
        NonEmptyString.validateOptional(
          "addressStreetNumber",
          d.addressStreetNumber
        ),
        Email.validateOptional("addressEmail", d.addressEmail)
      ).mapN(
        (
            countryCode,
            businessName,
            vatNumber,
            addressCountry,
            addressProvince,
            addressZIP,
            addressCity,
            addressStreet,
            addressStreetNumber,
            addressEmail
        ) =>
          ValidBusinessUpdateData(
            countryCode,
            businessName,
            vatNumber,
            addressCountry,
            addressProvince,
            addressZIP,
            addressCity,
            addressStreet,
            addressStreetNumber,
            addressEmail
          )
      )

  def fromCreationData(data: CreationData, customer: User)(using
      Lang
  ): Result[Client] =
    validateCreationData(data).toResult.map(_ match
      case d: ValidPrivateCreationData =>
        PrivateClient(
          ObjectId(),
          d.fiscalCode,
          d.firstName,
          d.lastName,
          d.addressCountry,
          d.addressProvince,
          d.addressZIP,
          d.addressCity,
          d.addressStreet,
          d.addressStreetNumber,
          d.addressEmail,
          customer._id,
          BsonDateTime(System.currentTimeMillis),
          BsonDateTime(System.currentTimeMillis)
        )
      case d: ValidBusinessCreationData =>
        BusinessClient(
          ObjectId(),
          d.countryCode,
          d.businessName,
          d.vatNumber,
          d.addressCountry,
          d.addressProvince,
          d.addressZIP,
          d.addressCity,
          d.addressStreet,
          d.addressStreetNumber,
          d.addressEmail,
          customer._id,
          BsonDateTime(System.currentTimeMillis),
          BsonDateTime(System.currentTimeMillis)
        )
    )
}

extension (client: Client) {
  def fold[T](
      whenPrivate: PrivateClient => T,
      whenBusiness: BusinessClient => T
  ): T =
    client match
      case c: PrivateClient  => whenPrivate(c)
      case c: BusinessClient => whenBusiness(c)

  def asPrivate(using a: Assertions): PrivateClient = client match
    case c: PrivateClient => c
    case _: BusinessClient =>
      a.fail("Trying to cast business client to private client")

  def asBusiness(using a: Assertions): BusinessClient = client match
    case c: BusinessClient => c
    case _: PrivateClient =>
      a.fail("Trying to cast private client to business client")
}

object Clients {
  val collection = Collection[Client]("clients")

  def create(
      data: Client.CreationData
  )(using customer: User)(using Lang): IO[Result[Client]] =
    Client.fromCreationData(data, customer).lift(collection.create(_))

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): IO[Result[Client]] =
    collection
      .use(
        _.find(Filter.eq("_id", _id).and(Filter.eq("user", customer._id))).first
      )
      .map(_.toRight(Error(NotFound, __.ErrorClientNotFound)))

  def update(_id: ObjectId, data: Client.UpdateData)(using customer: User)(using
      Lang
  ): IO[Result[Client]] =
    findById(_id).flatMap(_.lift { client =>
      Client.validateUpdateData(data).toResult.lift { data =>
        val updates = (data match
          case d: Client.ValidPrivateUpdateData =>
            List(
              d.fiscalCode.map(Updates.set("fiscalCode", _)).toList,
              d.firstName.map(Updates.set("firstName", _)).toList,
              d.lastName.map(Updates.set("lastName", _)).toList,
              d.addressCountry.map(Updates.set("addressCountry", _)).toList,
              d.addressProvince.map(Updates.set("addressProvince", _)).toList,
              d.addressZIP.map(Updates.set("addressZIP", _)).toList,
              d.addressCity.map(Updates.set("addressCity", _)).toList,
              d.addressStreet.map(Updates.set("addressStreet", _)).toList,
              d.addressStreetNumber
                .map(Updates.set("addressStreetNumber", _))
                .toList,
              d.addressEmail.map(Updates.set("addressEmail", _)).toList
            )
          case d: Client.ValidBusinessUpdateData =>
            List(
              d.countryCode.map(Updates.set("countryCode", _)).toList,
              d.businessName.map(Updates.set("businessName", _)).toList,
              d.vatNumber.map(Updates.set("vatNumber", _)).toList,
              d.addressCountry.map(Updates.set("addressCountry", _)).toList,
              d.addressProvince.map(Updates.set("addressProvince", _)).toList,
              d.addressZIP.map(Updates.set("addressZIP", _)).toList,
              d.addressCity.map(Updates.set("addressCity", _)).toList,
              d.addressStreet.map(Updates.set("addressStreet", _)).toList,
              d.addressStreetNumber
                .map(Updates.set("addressStreetNumber", _))
                .toList,
              d.addressEmail.map(Updates.set("addressEmail", _)).toList
            )
        ).flatten ++ List(
          Some(
            Updates.set(
              "updatedAt",
              BsonDateTime(System.currentTimeMillis).getValue
            )
          ).toList
        ).flatten

        collection.update(client, Updates.combine(updates.asJava))
      }
    })

  def delete(
      _id: ObjectId
  )(using customer: User)(using Lang): IO[Result[Client]] =
    for
      client <- findById(_id)
      _ <- client.lift(collection.delete(_))
    yield client

  def find(query: CursorQuery)(using
      customer: User
  )(using Lang): IO[Result[Cursor[Client]]] = {
    val filterByCustomerAndAddName = Seq(
      Aggregates.`match`(Filters.eq("user", customer._id)),
      Aggregates.addFields(
        Field(
          "name",
          Doc(
            "$cond" -> Doc(
              "if" -> Doc(
                "$gt" -> List("$firstName", null)
              ),
              "then" -> Doc(
                "$concat" -> List("$firstName", " ", "$lastName")
              ),
              "else" -> "$businessName"
            )
          )
        )
      )
    )

    val queryString = query match
      case q: CursorQueryAsc  => q.query
      case q: CursorQueryDesc => q.query

    val findByQuery = queryString.fold(Seq.empty)(query =>
      Seq(
        Aggregates.`match`(Filters.regex("name", query, "i"))
      )
    )

    val sortingOrder: 1 | -1 = query match
      case _: CursorQueryAsc  => 1
      case _: CursorQueryDesc => -1

    val skipCriteria = query match
      case q: CursorQueryAsc => Filters.gt("name", q.after.getOrElse(""))
      case q: CursorQueryDesc =>
        q.before.fold(Filters.empty)(Filters.lt("name", _))

    val limit = query match
      case q: CursorQueryAsc  => q.first
      case q: CursorQueryDesc => q.last

    val minCriteria = query match
      case _: CursorQueryAsc  => Doc("$min" -> "$name")
      case _: CursorQueryDesc => Doc("$max" -> "$name")

    val maxCriteria = query match
      case _: CursorQueryAsc  => Doc("$max" -> "$name")
      case _: CursorQueryDesc => Doc("$min" -> "$name")

    val rest = Seq(
      Aggregates.sort(Doc("name" -> sortingOrder)),
      Aggregates.facet(
        Facet(
          "global",
          List(
            Aggregates.group(
              null,
              List(
                BsonField("totalCount", Doc("$sum" -> 1)),
                BsonField("min", minCriteria),
                BsonField("max", maxCriteria)
              ).asJava
            )
          ).asJava
        ),
        Facet(
          "data",
          List(
            Aggregates.`match`(skipCriteria),
            Aggregates.limit(limit.getOrElse(Config.defaultPageSize))
          ).asJava
        )
      ),
      Aggregates.project(
        Doc(
          "edges" -> Doc(
            "$map" -> Doc(
              "input" -> "$data",
              "as" -> "item",
              "in" -> Doc(
                "node" -> "$$item",
                "cursor" -> "$$item.name"
              )
            )
          ),
          "global" -> Doc(
            "$arrayElemAt" -> List("$global", 0)
          ),
          "order" -> Doc(
            "$map" -> Doc(
              "input" -> "$data",
              "as" -> "item",
              "in" -> "$$item.name"
            )
          )
        )
      ),
      Aggregates.project(
        Doc(
          "edges" -> "$edges",
          "global" -> "$global",
          "min" -> Doc(
            "$arrayElemAt" -> List(Doc("$slice" -> List("$order", 1)), 0)
          ),
          "max" -> Doc(
            "$arrayElemAt" -> List(Doc("$slice" -> List("$order", -1)), 0)
          )
        )
      ),
      Aggregates.project(
        Doc(
          "edges" -> "$edges",
          "pageInfo" -> Doc(
            "totalCount" -> "$global.totalCount",
            "startCursor" -> "$min",
            "endCursor" -> "$max",
            "hasPreviousPage" -> Doc("$ne" -> List("$global.min", "$min")),
            "hasNextPage" -> Doc("$ne" -> List("$global.max", "$max"))
          )
        )
      )
    )

    val aggregation = filterByCustomerAndAddName ++ findByQuery ++ rest

    collection.use(
      _.aggregateWithCodec[Cursor[Client]](aggregation).first
        .map(_.toRight(Error(InternalServerError, __.ErrorUnknown)))
    )
  }
}

given Encoder[Client] with Decoder[Client] with {
  override def apply(client: Client): Json = client match
    case privateClient: PrivateClient   => privateClient.asJson
    case businessClient: BusinessClient => businessClient.asJson

  override def apply(c: HCursor): Decoder.Result[Client] =
    c.as[BusinessClient].orElse[DecodingFailure, Client](c.as[PrivateClient])
}

given EntityEncoder[IO, Client] = jsonEncoderOf[IO, Client]
given EntityDecoder[IO, Client] = jsonOf[IO, Client]

opaque type CountryCode = String
opaque type ProvinceCode = String

object CountryCode extends Validator[String, CountryCode] {
  override def name = "CountryCode"

  override def decode(s: String): Option[CountryCode] = codes.find(_ == s)

  override def validate(fieldName: String, value: String)(using
      Lang
  ): Validation[CountryCode] =
    validate(
      value,
      ValidationError(fieldName, __.ErrorDecodeInvalidCountryCode)
    )

  private lazy val codes = Array[String](
    "AF",
    "AL",
    "DZ",
    "AD",
    "AO",
    "AI",
    "AQ",
    "AG",
    "SA",
    "AR",
    "AM",
    "AW",
    "AU",
    "AT",
    "AZ",
    "BS",
    "BH",
    "BD",
    "BB",
    "BE",
    "BZ",
    "BJ",
    "BM",
    "BT",
    "BY",
    "MM",
    "BO",
    "BA",
    "BW",
    "BR",
    "BN",
    "BG",
    "BF",
    "BI",
    "KH",
    "CM",
    "CA",
    "CV",
    "TD",
    "CL",
    "CN",
    "CY",
    "VA",
    "CO",
    "KM",
    "KP",
    "KR",
    "CI",
    "CR",
    "HR",
    "CU",
    "CW",
    "DK",
    "DM",
    "EC",
    "EG",
    "SV",
    "AE",
    "ER",
    "EE",
    "ET",
    "FJ",
    "PH",
    "FI",
    "FR",
    "GA",
    "GM",
    "GS",
    "GE",
    "DE",
    "GH",
    "JM",
    "JP",
    "GI",
    "DJ",
    "JO",
    "GR",
    "GD",
    "GL",
    "GP",
    "GU",
    "GT",
    "GG",
    "GQ",
    "GW",
    "GN",
    "GF",
    "GY",
    "HT",
    "HN",
    "HK",
    "IN",
    "ID",
    "IR",
    "IQ",
    "IE",
    "IS",
    "BV",
    "CX",
    "IM",
    "NF",
    "AX",
    "BQ",
    "KY",
    "CC",
    "CK",
    "FO",
    "FK",
    "HM",
    "MP",
    "MH",
    "UM",
    "PN",
    "SB",
    "TC",
    "VI",
    "VG",
    "IL",
    "IT",
    "JE",
    "KZ",
    "KE",
    "KG",
    "KI",
    "KW",
    "LA",
    "LS",
    "LV",
    "LB",
    "LR",
    "LY",
    "LI",
    "LT",
    "LU",
    "MO",
    "MK",
    "MG",
    "MW",
    "MY",
    "MV",
    "ML",
    "MT",
    "MA",
    "MQ",
    "MR",
    "MU",
    "YT",
    "MX",
    "MD",
    "MC",
    "MN",
    "ME",
    "MS",
    "MZ",
    "NA",
    "NR",
    "NP",
    "NI",
    "NE",
    "NG",
    "NU",
    "NO",
    "NC",
    "NZ",
    "OM",
    "NL",
    "PK",
    "PW",
    "PA",
    "PG",
    "PY",
    "PE",
    "PF",
    "PL",
    "PR",
    "PT",
    "QA",
    "GB",
    "CZ",
    "CF",
    "CG",
    "CD",
    "TW",
    "DO",
    "RE",
    "RO",
    "RW",
    "RU",
    "EH",
    "KN",
    "VC",
    "BL",
    "MF",
    "PM",
    "AS",
    "WS",
    "SM",
    "SH",
    "LC",
    "ST",
    "SN",
    "RS",
    "SC",
    "SL",
    "SG",
    "SX",
    "SY",
    "SK",
    "SI",
    "SO",
    "ES",
    "LK",
    "FM",
    "US",
    "PS",
    "ZA",
    "SS",
    "SD",
    "SR",
    "SJ",
    "SE",
    "CH",
    "SZ",
    "TJ",
    "TZ",
    "IO",
    "TF",
    "TH",
    "TL",
    "TG",
    "TK",
    "TO",
    "TT",
    "TN",
    "TR",
    "TM",
    "TV",
    "UA",
    "UG",
    "HU",
    "UY",
    "UZ",
    "VU",
    "VE",
    "VN",
    "WF",
    "YE",
    "ZM",
    "ZW"
  )
}

object ProvinceCode extends Validator[String, ProvinceCode] {
  override def name = "ProvinceCode"

  override def decode(s: String): Option[ProvinceCode] = codes.find(_ == s)

  override def validate(fieldName: String, value: String)(using
      Lang
  ): Validation[ProvinceCode] =
    validate(
      value,
      ValidationError(fieldName, __.ErrorDecodeInvalidProvinceCode)
    )

  private lazy val codes = Array[String](
    "AG",
    "AL",
    "AN",
    "AO",
    "AQ",
    "AR",
    "AP",
    "AT",
    "AV",
    "BA",
    "BT",
    "BL",
    "BN",
    "BG",
    "BI",
    "BO",
    "BZ",
    "BS",
    "BR",
    "CA",
    "CL",
    "CB",
    "CI",
    "CE",
    "CT",
    "CZ",
    "CH",
    "CO",
    "CS",
    "CR",
    "KR",
    "CN",
    "EN",
    "FM",
    "FE",
    "FI",
    "FG",
    "FC",
    "FR",
    "GE",
    "GO",
    "GR",
    "IM",
    "IS",
    "SP",
    "LT",
    "LE",
    "LC",
    "LI",
    "LO",
    "LU",
    "MC",
    "MN",
    "MS",
    "MT",
    "VS",
    "ME",
    "MI",
    "MO",
    "MB",
    "NA",
    "NO",
    "NU",
    "OG",
    "OT",
    "OR",
    "PD",
    "PA",
    "PR",
    "PV",
    "PG",
    "PU",
    "PE",
    "PC",
    "PI",
    "PT",
    "PN",
    "PZ",
    "PO",
    "RG",
    "RA",
    "RC",
    "RE",
    "RI",
    "RN",
    "RO",
    "SA",
    "SS",
    "SV",
    "SI",
    "SR",
    "SO",
    "TA",
    "TE",
    "TR",
    "TO",
    "TP",
    "TN",
    "TV",
    "TS",
    "UD",
    "VA",
    "VE",
    "VB",
    "VC",
    "VR",
    "VV",
    "VI",
    "VT",
    "EE"
  )
}
