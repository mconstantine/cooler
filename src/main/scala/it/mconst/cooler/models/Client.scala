package it.mconst.cooler.models

import cats.data.EitherT
import cats.effect.IO
import cats.syntax.all.none
import cats.syntax.apply.*
import com.mongodb.client.model.Aggregates
import com.mongodb.client.model.Field
import com.mongodb.client.model.Filters
import com.osinka.i18n.Lang
import io.circe.Decoder
import io.circe.DecodingFailure
import io.circe.Encoder
import io.circe.generic.auto.*
import io.circe.HCursor
import io.circe.Json
import io.circe.syntax.*
import it.mconst.cooler.models.user.User
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Collection
import it.mconst.cooler.utils.Config
import it.mconst.cooler.utils.DbDocument
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import mongo4cats.bson.Document
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder

sealed abstract trait Client(
    _id: ObjectId,
    addressCountry: CountryCode,
    addressProvince: ProvinceCode,
    addressZIP: NonEmptyString,
    addressCity: NonEmptyString,
    addressStreet: NonEmptyString,
    addressStreetNumber: Option[NonEmptyString],
    addressEmail: Email,
    val user: ObjectId,
    createdAt: BsonDateTime,
    updatedAt: BsonDateTime
) extends DbDocument {
  def name: String
}

final case class PrivateClient(
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
    override val user: ObjectId,
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

final case class BusinessClient(
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
    override val user: ObjectId,
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
  sealed abstract trait InputData(
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

  final case class PrivateInputData(
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
  ) extends InputData(
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

  final case class BusinessInputData(
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
  ) extends InputData(
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

  given Encoder[InputData] with Decoder[InputData] with {
    override def apply(client: InputData): Json = client match
      case privateCreationData: PrivateInputData =>
        privateCreationData.asJson
      case businessCreationData: BusinessInputData =>
        businessCreationData.asJson

    override def apply(c: HCursor): Decoder.Result[InputData] =
      c.as[BusinessInputData]
        .orElse[DecodingFailure, InputData](c.as[PrivateInputData])
  }

  given EntityEncoder[IO, PrivateInputData] =
    jsonEncoderOf[IO, PrivateInputData]

  given EntityDecoder[IO, PrivateInputData] = jsonOf[IO, PrivateInputData]

  given EntityEncoder[IO, BusinessInputData] =
    jsonEncoderOf[IO, BusinessInputData]

  given EntityDecoder[IO, BusinessInputData] =
    jsonOf[IO, BusinessInputData]

  given EntityEncoder[IO, InputData] = jsonEncoderOf[IO, InputData]
  given EntityDecoder[IO, InputData] = jsonOf[IO, InputData]

  sealed abstract trait ValidInputData(
      addressCountry: CountryCode,
      addressProvince: ProvinceCode,
      addressZIP: NonEmptyString,
      addressCity: NonEmptyString,
      addressStreet: NonEmptyString,
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Email
  )

  final case class ValidPrivateInputData(
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
  ) extends ValidInputData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  final case class ValidBusinessInputData(
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
  ) extends ValidInputData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  def validateInputData(data: InputData)(using
      Lang
  ): Validation[ValidInputData] = data match
    case d: PrivateInputData =>
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
          ValidPrivateInputData(
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
    case d: BusinessInputData =>
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
          ValidBusinessInputData(
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

  def fromInputData(data: InputData, customer: User)(using
      Lang
  ): Either[Error, Client] =
    validateInputData(data).toResult.map(_ match
      case d: ValidPrivateInputData =>
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
      case d: ValidBusinessInputData =>
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
}

object Clients {
  val collection = Collection[IO, Client.InputData, Client]("clients")

  def create(
      data: Client.InputData
  )(using customer: User)(using Lang): EitherT[IO, Error, Client] =
    collection.use(c =>
      EitherT
        .fromEither[IO](Client.fromInputData(data, customer))
        .flatMap(c.create(_))
    )

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, Client] =
    collection.use(c =>
      c.findOne(Filter.eq("_id", _id).and(Filter.eq("user", customer._id)))
        .leftMap(_ => Error(NotFound, __.ErrorClientNotFound))
    )

  def update(_id: ObjectId, data: Client.InputData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Client] =
    for
      client <- findById(_id)
      data <- EitherT.fromEither[IO](Client.validateInputData(data).toResult)
      result <- collection.use(
        _.update(
          client._id,
          data match
            case d: Client.ValidPrivateInputData =>
              collection.Update
                .`with`("fiscalCode" -> d.fiscalCode)
                .`with`("firstName" -> d.firstName)
                .`with`("lastName" -> d.lastName)
                .`with`("addressCountry" -> d.addressCountry)
                .`with`("addressProvince" -> d.addressProvince)
                .`with`("addressZIP" -> d.addressZIP)
                .`with`("addressCity" -> d.addressCity)
                .`with`("addressStreet" -> d.addressStreet)
                .`with`(
                  "addressStreetNumber" -> d.addressStreetNumber,
                  collection.UpdateStrategy.UnsetIfEmpty
                )
                .`with`("addressEmail" -> d.addressEmail)
                .build
            case d: Client.ValidBusinessInputData =>
              collection.Update
                .`with`("countryCode" -> d.countryCode)
                .`with`("businessName" -> d.businessName)
                .`with`("vatNumber" -> d.vatNumber)
                .`with`("addressCountry" -> d.addressCountry)
                .`with`("addressProvince" -> d.addressProvince)
                .`with`("addressZIP" -> d.addressZIP)
                .`with`("addressCity" -> d.addressCity)
                .`with`("addressStreet" -> d.addressStreet)
                .`with`(
                  "addressStreetNumber" -> d.addressStreetNumber,
                  collection.UpdateStrategy.UnsetIfEmpty
                )
                .`with`("addressEmail" -> d.addressEmail)
                .build
        )
      )
    yield result

  def delete(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, Client] =
    findById(_id).flatMap(client => collection.use(_.delete(client._id)))

  def find(query: CursorQuery)(using
      customer: User
  )(using Lang): EitherT[IO, Error, Cursor[Client]] =
    collection.use(
      _.find(
        "name",
        Seq(
          Aggregates.`match`(Filters.eq("user", customer._id)),
          Aggregates.addFields(
            Field(
              "name",
              Document(
                "$cond" -> Document(
                  "if" -> Document(
                    "$gt" -> List("$firstName", null)
                  ),
                  "then" -> Document(
                    "$concat" -> List("$firstName", " ", "$lastName")
                  ),
                  "else" -> "$businessName"
                )
              )
            )
          )
        )
      )(query)
    )
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
