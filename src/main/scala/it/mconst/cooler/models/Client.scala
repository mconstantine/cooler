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
  sealed abstract trait CreationData(
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

  final case class PrivateCreationData(
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

  final case class BusinessCreationData(
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

  sealed abstract trait ValidCreationData(
      addressCountry: CountryCode,
      addressProvince: ProvinceCode,
      addressZIP: NonEmptyString,
      addressCity: NonEmptyString,
      addressStreet: NonEmptyString,
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Email
  )

  final case class ValidPrivateCreationData(
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

  final case class ValidBusinessCreationData(
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

  sealed abstract trait UpdateData(
      addressCountry: Option[String],
      addressProvince: Option[String],
      addressZIP: Option[String],
      addressCity: Option[String],
      addressStreet: Option[String],
      addressStreetNumber: Option[String],
      addressEmail: Option[String]
  )

  final case class PrivateUpdateData(
      fiscalCode: Option[String] = none[String],
      firstName: Option[String] = none[String],
      lastName: Option[String] = none[String],
      addressCountry: Option[String] = none[String],
      addressProvince: Option[String] = none[String],
      addressZIP: Option[String] = none[String],
      addressCity: Option[String] = none[String],
      addressStreet: Option[String] = none[String],
      addressStreetNumber: Option[String] = none[String],
      addressEmail: Option[String] = none[String]
  ) extends UpdateData(
        addressCountry,
        addressProvince,
        addressZIP,
        addressCity,
        addressStreet,
        addressStreetNumber,
        addressEmail
      )

  final case class BusinessUpdateData(
      countryCode: Option[String] = none[String],
      businessName: Option[String] = none[String],
      vatNumber: Option[String] = none[String],
      addressCountry: Option[String] = none[String],
      addressProvince: Option[String] = none[String],
      addressZIP: Option[String] = none[String],
      addressCity: Option[String] = none[String],
      addressStreet: Option[String] = none[String],
      addressStreetNumber: Option[String] = none[String],
      addressEmail: Option[String] = none[String]
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

  sealed abstract trait ValidUpdateData(
      addressCountry: Option[CountryCode],
      addressProvince: Option[ProvinceCode],
      addressZIP: Option[NonEmptyString],
      addressCity: Option[NonEmptyString],
      addressStreet: Option[NonEmptyString],
      addressStreetNumber: Option[NonEmptyString],
      addressEmail: Option[Email]
  )

  final case class ValidPrivateUpdateData(
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

  final case class ValidBusinessUpdateData(
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
  ): Either[Error, Client] =
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
}

object Clients {
  val collectionName = "clients"
  val collection = Collection[IO, Client](collectionName)

  def create(
      data: Client.CreationData
  )(using customer: User)(using Lang): EitherT[IO, Error, Client] =
    collection.use(c =>
      EitherT
        .fromEither[IO](Client.fromCreationData(data, customer))
        .flatMap(c.create(_))
    )

  def findById(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, Client] =
    collection.use(c =>
      c.findOne(Filter.eq("_id", _id).and(Filter.eq("user", customer._id)))
        .leftMap(_ => Error(NotFound, __.ErrorClientNotFound))
    )

  def update(_id: ObjectId, data: Client.UpdateData)(using customer: User)(using
      Lang
  ): EitherT[IO, Error, Client] =
    for
      client <- findById(_id)
      data <- EitherT.fromEither[IO](Client.validateUpdateData(data).toResult)
      result <- collection.use(
            _.update(
              client._id,
              data match
                case d: Client.ValidPrivateUpdateData =>
                  Map(
                    "fiscalCode" -> d.fiscalCode,
                    "firstName" -> d.firstName,
                    "lastName" -> d.lastName,
                    "addressCountry" -> d.addressCountry,
                    "addressProvince" -> d.addressProvince,
                    "addressZIP" -> d.addressZIP,
                    "addressCity" -> d.addressCity,
                    "addressStreet" -> d.addressStreet,
                    "addressStreetNumber" -> d.addressStreetNumber,
                    "addressEmail" -> d.addressEmail
                  )
                case d: Client.ValidBusinessUpdateData =>
                  Map(
                    "countryCode" -> d.countryCode,
                    "businessName" -> d.businessName,
                    "vatNumber" -> d.vatNumber,
                    "addressCountry" -> d.addressCountry,
                    "addressProvince" -> d.addressProvince,
                    "addressZIP" -> d.addressZIP,
                    "addressCity" -> d.addressCity,
                    "addressStreet" -> d.addressStreet,
                    "addressStreetNumber" -> d.addressStreetNumber,
                    "addressEmail" -> d.addressEmail
                  )
            )
    yield result

  def delete(
      _id: ObjectId
  )(using customer: User)(using Lang): EitherT[IO, Error, Client] =
    findById(_id).flatMap(client => collection.use(_.delete(_id)))

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
