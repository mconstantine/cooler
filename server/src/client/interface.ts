import { either, option } from 'fp-ts'
import { Either } from 'fp-ts/Either'
import { flow, pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { Reader } from 'fp-ts/Reader'
import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable,
  date
} from 'io-ts-types'
import {
  makeCollection,
  ObjectId,
  ObjectIdFromString,
  WithIdC
} from '../misc/Entity'
import { EmailString, optionFromNull } from '../misc/Types'
import { WithId } from 'mongodb'

export const ClientType = t.keyof({
  PRIVATE: true,
  BUSINESS: true
})
export type ClientType = t.TypeOf<typeof ClientType>

export const Province = t.keyof(
  {
    AG: 'Agrigento',
    AL: 'Alessandria',
    AN: 'Ancona',
    AO: 'Aosta',
    AQ: "L'Aquila",
    AR: 'Arezzo',
    AP: 'Ascoli-Piceno',
    AT: 'Asti',
    AV: 'Avellino',
    BA: 'Bari',
    BT: 'Barletta-Andria-Trani',
    BL: 'Belluno',
    BN: 'Benevento',
    BG: 'Bergamo',
    BI: 'Biella',
    BO: 'Bologna',
    BZ: 'Bolzano',
    BS: 'Brescia',
    BR: 'Brindisi',
    CA: 'Cagliari',
    CL: 'Caltanissetta',
    CB: 'Campobasso',
    CI: 'Carbonia Iglesias',
    CE: 'Caserta',
    CT: 'Catania',
    CZ: 'Catanzaro',
    CH: 'Chieti',
    CO: 'Como',
    CS: 'Cosenza',
    CR: 'Cremona',
    KR: 'Crotone',
    CN: 'Cuneo',
    EN: 'Enna',
    FM: 'Fermo',
    FE: 'Ferrara',
    FI: 'Firenze',
    FG: 'Foggia',
    FC: 'Forli-Cesena',
    FR: 'Frosinone',
    GE: 'Genova',
    GO: 'Gorizia',
    GR: 'Grosseto',
    IM: 'Imperia',
    IS: 'Isernia',
    SP: 'La-Spezia',
    LT: 'Latina',
    LE: 'Lecce',
    LC: 'Lecco',
    LI: 'Livorno',
    LO: 'Lodi',
    LU: 'Lucca',
    MC: 'Macerata',
    MN: 'Mantova',
    MS: 'Massa-Carrara',
    MT: 'Matera',
    VS: 'Medio Campidano',
    ME: 'Messina',
    MI: 'Milano',
    MO: 'Modena',
    MB: 'Monza-Brianza',
    NA: 'Napoli',
    NO: 'Novara',
    NU: 'Nuoro',
    OG: 'Ogliastra',
    OT: 'Olbia Tempio',
    OR: 'Oristano',
    PD: 'Padova',
    PA: 'Palermo',
    PR: 'Parma',
    PV: 'Pavia',
    PG: 'Perugia',
    PU: 'Pesaro-Urbino',
    PE: 'Pescara',
    PC: 'Piacenza',
    PI: 'Pisa',
    PT: 'Pistoia',
    PN: 'Pordenone',
    PZ: 'Potenza',
    PO: 'Prato',
    RG: 'Ragusa',
    RA: 'Ravenna',
    RC: 'Reggio-Calabria',
    RE: 'Reggio-Emilia',
    RI: 'Rieti',
    RN: 'Rimini',
    RO: 'Rovigo',
    SA: 'Salerno',
    SS: 'Sassari',
    SV: 'Savona',
    SI: 'Siena',
    SR: 'Siracusa',
    SO: 'Sondrio',
    TA: 'Taranto',
    TE: 'Teramo',
    TR: 'Terni',
    TO: 'Torino',
    TP: 'Trapani',
    TN: 'Trento',
    TV: 'Treviso',
    TS: 'Trieste',
    UD: 'Udine',
    VA: 'Varese',
    VE: 'Venezia',
    VB: 'Verbania',
    VC: 'Vercelli',
    VR: 'Verona',
    VV: 'Vibo-Valentia',
    VI: 'Vicenza',
    VT: 'Viterbo',
    EE: 'Estero'
  },
  'Province'
)
export type Province = t.TypeOf<typeof Province>

export const Country = t.keyof(
  {
    AF: 'Afghanistan',
    AL: 'Albania',
    DZ: 'Algeria',
    AD: 'Andorra',
    AO: 'Angola',
    AI: 'Anguilla',
    AQ: 'Antartide',
    AG: 'Antigua e Barbuda',
    SA: 'Arabia Saudita',
    AR: 'Argentina',
    AM: 'Armenia',
    AW: 'Aruba',
    AU: 'Australia',
    AT: 'Austria',
    AZ: 'Azerbaigian',
    BS: 'Bahamas',
    BH: 'Bahrein',
    BD: 'Bangladesh',
    BB: 'Barbados',
    BE: 'Belgio',
    BZ: 'Belize',
    BJ: 'Benin',
    BM: 'Bermuda',
    BT: 'Bhutan',
    BY: 'Bielorussia',
    MM: 'Birmania',
    BO: 'Bolivia',
    BA: 'Bosnia ed Erzegovina',
    BW: 'Botswana',
    BR: 'Brasile',
    BN: 'Brunei',
    BG: 'Bulgaria',
    BF: 'Burkina Faso',
    BI: 'Burundi',
    KH: 'Cambogia',
    CM: 'Camerun',
    CA: 'Canada',
    CV: 'Capo Verde',
    TD: 'Ciad',
    CL: 'Cile',
    CN: 'Cina',
    CY: 'Cipro',
    VA: 'Città del Vaticano',
    CO: 'Colombia',
    KM: 'Comore',
    KP: 'Corea del Nord',
    KR: 'Corea del Sud',
    CI: "Costa d'Avorio",
    CR: 'Costa Rica',
    HR: 'Croazia',
    CU: 'Cuba',
    CW: 'Curaçao',
    DK: 'Danimarca',
    DM: 'Dominica',
    EC: 'Ecuador',
    EG: 'Egitto',
    SV: 'El Salvador',
    AE: 'Emirati Arabi Uniti',
    ER: 'Eritrea',
    EE: 'Estonia',
    ET: 'Etiopia',
    FJ: 'Figi',
    PH: 'Filippine',
    FI: 'Finlandia',
    FR: 'Francia',
    GA: 'Gabon',
    GM: 'Gambia',
    GS: 'Georgia del Sud e isole Sandwich meridionali',
    GE: 'Georgia',
    DE: 'Germania',
    GH: 'Ghana',
    JM: 'Giamaica',
    JP: 'Giappone',
    GI: 'Gibilterra',
    DJ: 'Gibuti',
    JO: 'Giordania',
    GR: 'Grecia',
    GD: 'Grenada',
    GL: 'Groenlandia',
    GP: 'Guadalupa',
    GU: 'Guam',
    GT: 'Guatemala',
    GG: 'Guernsey',
    GQ: 'Guinea Equatoriale',
    GW: 'Guinea-Bissau',
    GN: 'Guinea',
    GF: 'Guyana francese',
    GY: 'Guyana',
    HT: 'Haiti',
    HN: 'Honduras',
    HK: 'Hong Kong',
    IN: 'India',
    ID: 'Indonesia',
    IR: 'Iran',
    IQ: 'Iraq',
    IE: 'Irlanda',
    IS: 'Islanda',
    BV: 'Isola Bouvet',
    CX: 'Isola del Natale',
    IM: 'Isola di Man',
    NF: 'Isola Norfolk',
    AX: 'Isole Åland',
    BQ: 'Isole BES',
    KY: 'Isole Cayman',
    CC: 'Isole Cocos e Keeling',
    CK: 'Isole Cook',
    FO: 'Isole Fær Øer',
    FK: 'Isole Falkland',
    HM: 'Isole Heard e McDonald',
    MP: 'Isole Marianne Settentrionali',
    MH: 'Isole Marshall',
    UM: 'Isole minori esterne degli Stati Uniti',
    PN: 'Isole Pitcairn',
    SB: 'Isole Salomone',
    TC: 'Isole Turks e Caicos',
    VI: 'Isole Vergini americane',
    VG: 'Isole Vergini britanniche',
    IL: 'Israele',
    IT: 'Italia',
    JE: 'Jersey',
    KZ: 'Kazakistan',
    KE: 'Kenya',
    KG: 'Kirghizistan',
    KI: 'Kiribati',
    KW: 'Kuwait',
    LA: 'Laos',
    LS: 'Lesotho',
    LV: 'Lettonia',
    LB: 'Libano',
    LR: 'Liberia',
    LY: 'Libia',
    LI: 'Liechtenstein',
    LT: 'Lituania',
    LU: 'Lussemburgo',
    MO: 'Macao',
    MK: 'Macedonia del Nord',
    MG: 'Madagascar',
    MW: 'Malawi',
    MY: 'Malaysia',
    MV: 'Maldive',
    ML: 'Mali',
    MT: 'Malta',
    MA: 'Marocco',
    MQ: 'Martinica',
    MR: 'Mauritania',
    MU: 'Mauritius',
    YT: 'Mayotte',
    MX: 'Messico',
    MD: 'Moldavia',
    MC: 'Monaco',
    MN: 'Mongolia',
    ME: 'Montenegro',
    MS: 'Montserrat',
    MZ: 'Mozambico',
    NA: 'Namibia',
    NR: 'Nauru',
    NP: 'Nepal',
    NI: 'Nicaragua',
    NE: 'Niger',
    NG: 'Nigeria',
    NU: 'Niue',
    NO: 'Norvegia',
    NC: 'Nuova Caledonia',
    NZ: 'Nuova Zelanda',
    OM: 'Oman',
    NL: 'Paesi Bassi',
    PK: 'Pakistan',
    PW: 'Palau',
    PA: 'Panama',
    PG: 'Papua Nuova Guinea',
    PY: 'Paraguay',
    PE: 'Perù',
    PF: 'Polinesia Francese',
    PL: 'Polonia',
    PR: 'Porto Rico',
    PT: 'Portogallo',
    QA: 'Qatar',
    GB: 'Regno Unito',
    CZ: 'Repubblica Ceca',
    CF: 'Repubblica Centrafricana',
    CG: 'Repubblica del Congo',
    CD: 'Repubblica Democratica del Congo',
    TW: 'Repubblica di Cina',
    DO: 'Repubblica Dominicana',
    RE: 'Riunione',
    RO: 'Romania',
    RW: 'Ruanda',
    RU: 'Russia',
    EH: 'Sahara Occidentale',
    KN: 'Saint Kitts e Nevis',
    VC: 'Saint Vincent e Grenadine',
    BL: 'Saint-Barthélemy',
    MF: 'Saint-Martin',
    PM: 'Saint-Pierre e Miquelon',
    AS: 'Samoa Americane',
    WS: 'Samoa',
    SM: 'San Marino',
    SH: "Sant'Elena, Isola di Ascensione e Tristan da Cunha",
    LC: 'Santa Lucia',
    ST: 'São Tomé e Príncipe',
    SN: 'Senegal',
    RS: 'Serbia',
    SC: 'Seychelles',
    SL: 'Sierra Leone',
    SG: 'Singapore',
    SX: 'Sint Maarten',
    SY: 'Siria',
    SK: 'Slovacchia',
    SI: 'Slovenia',
    SO: 'Somalia',
    ES: 'Spagna',
    LK: 'Sri Lanka',
    FM: 'Stati Federati di Micronesia',
    US: "Stati Uniti d'America",
    PS: 'Stato di Palestina',
    ZA: 'Sudafrica',
    SS: 'Sudan del Sud',
    SD: 'Sudan',
    SR: 'Suriname',
    SJ: 'Svalbard e Jan Mayen',
    SE: 'Svezia',
    CH: 'Svizzera',
    SZ: 'Swaziland',
    TJ: 'Tagikistan',
    TZ: 'Tanzania',
    IO: "Territori Britannici dell'Oceano Indiano",
    TF: 'Territori Francesi del Sud',
    TH: 'Thailandia',
    TL: 'Timor Est',
    TG: 'Togo',
    TK: 'Tokelau',
    TO: 'Tonga',
    TT: 'Trinidad e Tobago',
    TN: 'Tunisia',
    TR: 'Turchia',
    TM: 'Turkmenistan',
    TV: 'Tuvalu',
    UA: 'Ucraina',
    UG: 'Uganda',
    HU: 'Ungheria',
    UY: 'Uruguay',
    UZ: 'Uzbekistan',
    VU: 'Vanuatu',
    VE: 'Venezuela',
    VN: 'Vietnam',
    WF: 'Wallis e Futuna',
    YE: 'Yemen',
    ZM: 'Zambia',
    ZW: 'Zimbabwe'
  },
  'Country'
)
export type Country = t.TypeOf<typeof Country>

// FIXME: these are used to create partials, so a custom codec is not feasible
// The solution is a double codec
const DatabaseClientProps = {
  type: ClientType,
  fiscalCode: optionFromNullable(NonEmptyString),
  firstName: optionFromNullable(NonEmptyString),
  lastName: optionFromNullable(NonEmptyString),
  countryCode: optionFromNullable(Country),
  vatNumber: optionFromNullable(NonEmptyString),
  businessName: optionFromNullable(NonEmptyString),
  addressCountry: Country,
  addressProvince: Province,
  addressCity: NonEmptyString,
  addressZip: NonEmptyString,
  addressStreet: NonEmptyString,
  addressStreetNumber: optionFromNullable(NonEmptyString),
  addressEmail: EmailString,
  user: ObjectId,
  createdAt: date,
  updatedAt: date
}

export const DatabaseClient = t.type(DatabaseClientProps, 'DatabaseClient')
export type DatabaseClient = t.TypeOf<typeof DatabaseClient>

const ClientCommonData = t.type(
  {
    _id: ObjectIdFromString,
    addressCountry: Country,
    addressProvince: Province,
    addressCity: NonEmptyString,
    addressZip: NonEmptyString,
    addressStreet: NonEmptyString,
    addressStreetNumber: optionFromNullable(NonEmptyString),
    addressEmail: EmailString,
    user: ObjectId,
    createdAt: DateFromISOString,
    updatedAt: DateFromISOString
  },
  'ClientCommonData'
)

const PrivateClient = t.intersection(
  [
    ClientCommonData,
    t.type({
      type: t.literal('PRIVATE'),
      fiscalCode: NonEmptyString,
      firstName: NonEmptyString,
      lastName: NonEmptyString
    })
  ],
  'PrivateClient'
)

const BusinessClient = t.intersection(
  [
    ClientCommonData,
    t.type({
      type: t.literal('BUSINESS'),
      countryCode: Country,
      vatNumber: NonEmptyString,
      businessName: NonEmptyString
    })
  ],
  'BusinessClient'
)

export const Client = t.union([PrivateClient, BusinessClient], 'Client')
export type Client = t.TypeOf<typeof Client>

function getCommonData(client: Client | WithId<DatabaseClient>) {
  return {
    _id: client._id,
    addressCountry: client.addressCountry,
    addressProvince: client.addressProvince,
    addressCity: client.addressCity,
    addressZip: client.addressZip,
    addressStreet: client.addressStreet,
    addressStreetNumber: client.addressStreetNumber,
    addressEmail: client.addressEmail,
    user: client.user,
    createdAt: client.createdAt,
    updatedAt: client.updatedAt
  }
}

const ClientFromDatabase = new t.Type<Client, WithId<DatabaseClient>>(
  'ClientFromDatabase',
  Client.is,
  (u, c) =>
    pipe(
      WithIdC(DatabaseClient).decode(u),
      either.chain(databaseClient => {
        const commonData = getCommonData(databaseClient)

        switch (databaseClient.type) {
          case 'PRIVATE':
            return pipe(
              {
                fiscalCode: databaseClient.fiscalCode,
                firstName: databaseClient.firstName,
                lastName: databaseClient.lastName
              },
              sequenceS(option.option),
              option.fold(
                () => t.failure(u, c),
                data =>
                  t.success({
                    type: 'PRIVATE',
                    ...commonData,
                    ...data
                  })
              )
            )
          case 'BUSINESS':
            return pipe(
              {
                countryCode: databaseClient.countryCode,
                vatNumber: databaseClient.vatNumber,
                businessName: databaseClient.businessName
              },
              sequenceS(option.option),
              option.fold(
                () => t.failure(u, c),
                data =>
                  t.success({
                    type: 'BUSINESS',
                    ...commonData,
                    ...data
                  })
              )
            )
        }
      })
    ),
  client => {
    const commonData = getCommonData(client)

    switch (client.type) {
      case 'PRIVATE':
        return {
          ...commonData,
          type: 'PRIVATE',
          fiscalCode: option.some(client.fiscalCode),
          firstName: option.some(client.firstName),
          lastName: option.some(client.lastName),
          countryCode: option.none,
          vatNumber: option.none,
          businessName: option.none
        }
      case 'BUSINESS':
        return {
          ...commonData,
          type: 'BUSINESS',
          countryCode: option.some(client.countryCode),
          vatNumber: option.some(client.vatNumber),
          businessName: option.some(client.businessName),
          fiscalCode: option.none,
          firstName: option.none,
          lastName: option.none
        }
    }
  }
)
type ClientFromDatabase = t.TypeOf<typeof ClientFromDatabase>

export const clientCollection = makeCollection(
  'clients',
  DatabaseClientProps,
  ClientFromDatabase
)

export const ClientCreationCommonInput = t.type(
  {
    addressCountry: Country,
    addressProvince: Province,
    addressCity: NonEmptyString,
    addressZip: NonEmptyString,
    addressStreet: NonEmptyString,
    addressStreetNumber: optionFromNullable(NonEmptyString),
    addressEmail: EmailString
  },
  'ClientCreationCommonInput'
)
export type ClientCreationCommonInput = t.TypeOf<
  typeof ClientCreationCommonInput
>

export const PrivateClientCreationInput = t.intersection([
  ClientCreationCommonInput,
  t.type(
    {
      type: t.literal('PRIVATE'),
      fiscalCode: NonEmptyString,
      firstName: NonEmptyString,
      lastName: NonEmptyString
    },
    'PrivateClientCreationInput'
  )
])
export type PrivateClientCreationInput = t.TypeOf<
  typeof PrivateClientCreationInput
>

export const BusinessClientCreationInput = t.intersection(
  [
    ClientCreationCommonInput,
    t.type({
      type: t.literal('BUSINESS'),
      countryCode: Country,
      vatNumber: NonEmptyString,
      businessName: NonEmptyString
    })
  ],
  'BusinessClientCreationInput'
)
export type BusinessClientCreationInput = t.TypeOf<
  typeof BusinessClientCreationInput
>

export const ClientCreationInput = t.union(
  [PrivateClientCreationInput, BusinessClientCreationInput],
  'ClientCreationInput'
)
export type ClientCreationInput = t.TypeOf<typeof ClientCreationInput>

// This actually returns a DatabaseClient.
export function clientCreationInputToDatabaseClient(
  input: ClientCreationInput,
  user: ObjectId
): ClientFromDatabase {
  const client = { ...input, user }

  return {
    ...client,
    ...pipe(
      client,
      foldClientType<
        ClientCreationInput & { user: ObjectId },
        Partial<DatabaseClient>
      >({
        PRIVATE: client => ({
          fiscalCode: option.some(client.fiscalCode),
          firstName: option.some(client.firstName),
          lastName: option.some(client.lastName),
          countryCode: option.none,
          businessName: option.none,
          vatNumber: option.none
        }),
        BUSINESS: client => ({
          fiscalCode: option.none,
          firstName: option.none,
          lastName: option.none,
          countryCode: option.some(client.countryCode),
          businessName: option.some(client.businessName),
          vatNumber: option.some(client.vatNumber)
        })
      })
    )
  } as ClientFromDatabase
}

// This actually returns a Partial<DatabaseClient>, but we are using two different codecs and io-ts
// is pretty confused by that.
export function clientUpdateInputToDatabaseClient(
  input: ClientUpdateInput
): Partial<ClientFromDatabase> {
  return {
    ...input,
    fiscalCode:
      input.type === 'PRIVATE' && input.fiscalCode
        ? option.fromNullable(input.fiscalCode)
        : undefined,
    firstName:
      input.type === 'PRIVATE' && input.firstName
        ? option.fromNullable(input.firstName)
        : undefined,
    lastName:
      input.type === 'PRIVATE' && input.lastName
        ? option.fromNullable(input.lastName)
        : undefined,
    // @ts-ignore
    countryCode:
      input.type === 'BUSINESS' && input.countryCode
        ? option.fromNullable(input.countryCode)
        : undefined,
    // @ts-ignore
    businessName:
      input.type === 'BUSINESS' && input.businessName
        ? option.fromNullable(input.businessName)
        : undefined,
    // @ts-ignore
    vatNumber:
      input.type === 'BUSINESS' && input.vatNumber
        ? option.fromNullable(input.vatNumber)
        : undefined
  }
}

export const ClientUpdateCommonInput = t.partial(
  {
    user: ObjectIdFromString,
    addressCountry: Country,
    addressProvince: Province,
    addressCity: NonEmptyString,
    addressZip: NonEmptyString,
    addressStreet: NonEmptyString,
    addressStreetNumber: optionFromNull(NonEmptyString),
    addressEmail: EmailString
  },
  'ClientUpdateCommonInput'
)
export type ClientUpdateCommonInput = t.TypeOf<typeof ClientUpdateCommonInput>

export const PrivateClientUpdateInput = t.intersection(
  [
    ClientUpdateCommonInput,
    t.partial({
      type: t.literal('PRIVATE'),
      fiscalCode: NonEmptyString,
      firstName: NonEmptyString,
      lastName: NonEmptyString
    })
  ],
  'PrivateClientUpdateInput'
)
export type PrivateClientUpdateInput = t.TypeOf<typeof PrivateClientUpdateInput>

export const BusinessClientUpdateInput = t.intersection(
  [
    ClientUpdateCommonInput,
    t.partial({
      type: t.literal('BUSINESS'),
      countryCode: Country,
      vatNumber: NonEmptyString,
      businessName: NonEmptyString,
      addressCountry: Country,
      addressProvince: Province,
      addressCity: NonEmptyString,
      addressZip: NonEmptyString,
      addressStreet: NonEmptyString,
      addressStreetNumber: optionFromNullable(NonEmptyString),
      addressEmail: EmailString
    })
  ],
  'BusinessClientUpdateInput'
)
export type BusinessClientUpdateInput = t.TypeOf<
  typeof BusinessClientUpdateInput
>

export const ClientUpdateInput = t.union(
  [PrivateClientUpdateInput, BusinessClientUpdateInput],
  'ClientUpdateInput'
)
export type ClientUpdateInput = t.TypeOf<typeof ClientUpdateInput>

export function foldClient<T>(
  cases: { [k in ClientType]: Reader<Extract<Client, { type: k }>, T> }
): Reader<Client, T> {
  return client => cases[client.type](client as any)
}

export function foldClientType<I extends { type: ClientType }, O>(
  cases: { [k in ClientType]: Reader<Extract<I, { type: k }>, O> }
): Reader<I, O> {
  return client => cases[client.type](client as any)
}
