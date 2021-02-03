import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import { unsafeLocalizedString } from '../a18n'
import { EmailString, PositiveInteger } from '../globalDomain'

export const ProvinceValues = {
  AG: unsafeLocalizedString('Agrigento'),
  AL: unsafeLocalizedString('Alessandria'),
  AN: unsafeLocalizedString('Ancona'),
  AO: unsafeLocalizedString('Aosta'),
  AQ: unsafeLocalizedString("L'Aquila"),
  AR: unsafeLocalizedString('Arezzo'),
  AP: unsafeLocalizedString('Ascoli-Piceno'),
  AT: unsafeLocalizedString('Asti'),
  AV: unsafeLocalizedString('Avellino'),
  BA: unsafeLocalizedString('Bari'),
  BT: unsafeLocalizedString('Barletta-Andria-Trani'),
  BL: unsafeLocalizedString('Belluno'),
  BN: unsafeLocalizedString('Benevento'),
  BG: unsafeLocalizedString('Bergamo'),
  BI: unsafeLocalizedString('Biella'),
  BO: unsafeLocalizedString('Bologna'),
  BZ: unsafeLocalizedString('Bolzano'),
  BS: unsafeLocalizedString('Brescia'),
  BR: unsafeLocalizedString('Brindisi'),
  CA: unsafeLocalizedString('Cagliari'),
  CL: unsafeLocalizedString('Caltanissetta'),
  CB: unsafeLocalizedString('Campobasso'),
  CI: unsafeLocalizedString('Carbonia Iglesias'),
  CE: unsafeLocalizedString('Caserta'),
  CT: unsafeLocalizedString('Catania'),
  CZ: unsafeLocalizedString('Catanzaro'),
  CH: unsafeLocalizedString('Chieti'),
  CO: unsafeLocalizedString('Como'),
  CS: unsafeLocalizedString('Cosenza'),
  CR: unsafeLocalizedString('Cremona'),
  KR: unsafeLocalizedString('Crotone'),
  CN: unsafeLocalizedString('Cuneo'),
  EN: unsafeLocalizedString('Enna'),
  FM: unsafeLocalizedString('Fermo'),
  FE: unsafeLocalizedString('Ferrara'),
  FI: unsafeLocalizedString('Firenze'),
  FG: unsafeLocalizedString('Foggia'),
  FC: unsafeLocalizedString('Forli-Cesena'),
  FR: unsafeLocalizedString('Frosinone'),
  GE: unsafeLocalizedString('Genova'),
  GO: unsafeLocalizedString('Gorizia'),
  GR: unsafeLocalizedString('Grosseto'),
  IM: unsafeLocalizedString('Imperia'),
  IS: unsafeLocalizedString('Isernia'),
  SP: unsafeLocalizedString('La-Spezia'),
  LT: unsafeLocalizedString('Latina'),
  LE: unsafeLocalizedString('Lecce'),
  LC: unsafeLocalizedString('Lecco'),
  LI: unsafeLocalizedString('Livorno'),
  LO: unsafeLocalizedString('Lodi'),
  LU: unsafeLocalizedString('Lucca'),
  MC: unsafeLocalizedString('Macerata'),
  MN: unsafeLocalizedString('Mantova'),
  MS: unsafeLocalizedString('Massa-Carrara'),
  MT: unsafeLocalizedString('Matera'),
  VS: unsafeLocalizedString('Medio Campidano'),
  ME: unsafeLocalizedString('Messina'),
  MI: unsafeLocalizedString('Milano'),
  MO: unsafeLocalizedString('Modena'),
  MB: unsafeLocalizedString('Monza-Brianza'),
  NA: unsafeLocalizedString('Napoli'),
  NO: unsafeLocalizedString('Novara'),
  NU: unsafeLocalizedString('Nuoro'),
  OG: unsafeLocalizedString('Ogliastra'),
  OT: unsafeLocalizedString('Olbia Tempio'),
  OR: unsafeLocalizedString('Oristano'),
  PD: unsafeLocalizedString('Padova'),
  PA: unsafeLocalizedString('Palermo'),
  PR: unsafeLocalizedString('Parma'),
  PV: unsafeLocalizedString('Pavia'),
  PG: unsafeLocalizedString('Perugia'),
  PU: unsafeLocalizedString('Pesaro-Urbino'),
  PE: unsafeLocalizedString('Pescara'),
  PC: unsafeLocalizedString('Piacenza'),
  PI: unsafeLocalizedString('Pisa'),
  PT: unsafeLocalizedString('Pistoia'),
  PN: unsafeLocalizedString('Pordenone'),
  PZ: unsafeLocalizedString('Potenza'),
  PO: unsafeLocalizedString('Prato'),
  RG: unsafeLocalizedString('Ragusa'),
  RA: unsafeLocalizedString('Ravenna'),
  RC: unsafeLocalizedString('Reggio-Calabria'),
  RE: unsafeLocalizedString('Reggio-Emilia'),
  RI: unsafeLocalizedString('Rieti'),
  RN: unsafeLocalizedString('Rimini'),
  RM: unsafeLocalizedString('Roma'),
  RO: unsafeLocalizedString('Rovigo'),
  SA: unsafeLocalizedString('Salerno'),
  SS: unsafeLocalizedString('Sassari'),
  SV: unsafeLocalizedString('Savona'),
  SI: unsafeLocalizedString('Siena'),
  SR: unsafeLocalizedString('Siracusa'),
  SO: unsafeLocalizedString('Sondrio'),
  TA: unsafeLocalizedString('Taranto'),
  TE: unsafeLocalizedString('Teramo'),
  TR: unsafeLocalizedString('Terni'),
  TO: unsafeLocalizedString('Torino'),
  TP: unsafeLocalizedString('Trapani'),
  TN: unsafeLocalizedString('Trento'),
  TV: unsafeLocalizedString('Treviso'),
  TS: unsafeLocalizedString('Trieste'),
  UD: unsafeLocalizedString('Udine'),
  VA: unsafeLocalizedString('Varese'),
  VE: unsafeLocalizedString('Venezia'),
  VB: unsafeLocalizedString('Verbania'),
  VC: unsafeLocalizedString('Vercelli'),
  VR: unsafeLocalizedString('Verona'),
  VV: unsafeLocalizedString('Vibo-Valentia'),
  VI: unsafeLocalizedString('Vicenza'),
  VT: unsafeLocalizedString('Viterbo'),
  EE: unsafeLocalizedString('Estero')
}

export const Province = t.keyof(ProvinceValues)
export type Province = t.TypeOf<typeof Province>

export const CountryValues = {
  AF: unsafeLocalizedString('Afghanistan'),
  AL: unsafeLocalizedString('Albania'),
  DZ: unsafeLocalizedString('Algeria'),
  AD: unsafeLocalizedString('Andorra'),
  AO: unsafeLocalizedString('Angola'),
  AI: unsafeLocalizedString('Anguilla'),
  AQ: unsafeLocalizedString('Antartide'),
  AG: unsafeLocalizedString('Antigua e Barbuda'),
  SA: unsafeLocalizedString('Arabia Saudita'),
  AR: unsafeLocalizedString('Argentina'),
  AM: unsafeLocalizedString('Armenia'),
  AW: unsafeLocalizedString('Aruba'),
  AU: unsafeLocalizedString('Australia'),
  AT: unsafeLocalizedString('Austria'),
  AZ: unsafeLocalizedString('Azerbaigian'),
  BS: unsafeLocalizedString('Bahamas'),
  BH: unsafeLocalizedString('Bahrein'),
  BD: unsafeLocalizedString('Bangladesh'),
  BB: unsafeLocalizedString('Barbados'),
  BE: unsafeLocalizedString('Belgio'),
  BZ: unsafeLocalizedString('Belize'),
  BJ: unsafeLocalizedString('Benin'),
  BM: unsafeLocalizedString('Bermuda'),
  BT: unsafeLocalizedString('Bhutan'),
  BY: unsafeLocalizedString('Bielorussia'),
  MM: unsafeLocalizedString('Birmania'),
  BO: unsafeLocalizedString('Bolivia'),
  BA: unsafeLocalizedString('Bosnia ed Erzegovina'),
  BW: unsafeLocalizedString('Botswana'),
  BR: unsafeLocalizedString('Brasile'),
  BN: unsafeLocalizedString('Brunei'),
  BG: unsafeLocalizedString('Bulgaria'),
  BF: unsafeLocalizedString('Burkina Faso'),
  BI: unsafeLocalizedString('Burundi'),
  KH: unsafeLocalizedString('Cambogia'),
  CM: unsafeLocalizedString('Camerun'),
  CA: unsafeLocalizedString('Canada'),
  CV: unsafeLocalizedString('Capo Verde'),
  TD: unsafeLocalizedString('Ciad'),
  CL: unsafeLocalizedString('Cile'),
  CN: unsafeLocalizedString('Cina'),
  CY: unsafeLocalizedString('Cipro'),
  VA: unsafeLocalizedString('Città del Vaticano'),
  CO: unsafeLocalizedString('Colombia'),
  KM: unsafeLocalizedString('Comore'),
  KP: unsafeLocalizedString('Corea del Nord'),
  KR: unsafeLocalizedString('Corea del Sud'),
  CI: unsafeLocalizedString("Costa d'Avorio"),
  CR: unsafeLocalizedString('Costa Rica'),
  HR: unsafeLocalizedString('Croazia'),
  CU: unsafeLocalizedString('Cuba'),
  CW: unsafeLocalizedString('Curaçao'),
  DK: unsafeLocalizedString('Danimarca'),
  DM: unsafeLocalizedString('Dominica'),
  EC: unsafeLocalizedString('Ecuador'),
  EG: unsafeLocalizedString('Egitto'),
  SV: unsafeLocalizedString('El Salvador'),
  AE: unsafeLocalizedString('Emirati Arabi Uniti'),
  ER: unsafeLocalizedString('Eritrea'),
  EE: unsafeLocalizedString('Estonia'),
  ET: unsafeLocalizedString('Etiopia'),
  FJ: unsafeLocalizedString('Figi'),
  PH: unsafeLocalizedString('Filippine'),
  FI: unsafeLocalizedString('Finlandia'),
  FR: unsafeLocalizedString('Francia'),
  GA: unsafeLocalizedString('Gabon'),
  GM: unsafeLocalizedString('Gambia'),
  GS: unsafeLocalizedString('Georgia del Sud e isole Sandwich meridionali'),
  GE: unsafeLocalizedString('Georgia'),
  DE: unsafeLocalizedString('Germania'),
  GH: unsafeLocalizedString('Ghana'),
  JM: unsafeLocalizedString('Giamaica'),
  JP: unsafeLocalizedString('Giappone'),
  GI: unsafeLocalizedString('Gibilterra'),
  DJ: unsafeLocalizedString('Gibuti'),
  JO: unsafeLocalizedString('Giordania'),
  GR: unsafeLocalizedString('Grecia'),
  GD: unsafeLocalizedString('Grenada'),
  GL: unsafeLocalizedString('Groenlandia'),
  GP: unsafeLocalizedString('Guadalupa'),
  GU: unsafeLocalizedString('Guam'),
  GT: unsafeLocalizedString('Guatemala'),
  GG: unsafeLocalizedString('Guernsey'),
  GQ: unsafeLocalizedString('Guinea Equatoriale'),
  GW: unsafeLocalizedString('Guinea-Bissau'),
  GN: unsafeLocalizedString('Guinea'),
  GF: unsafeLocalizedString('Guyana francese'),
  GY: unsafeLocalizedString('Guyana'),
  HT: unsafeLocalizedString('Haiti'),
  HN: unsafeLocalizedString('Honduras'),
  HK: unsafeLocalizedString('Hong Kong'),
  IN: unsafeLocalizedString('India'),
  ID: unsafeLocalizedString('Indonesia'),
  IR: unsafeLocalizedString('Iran'),
  IQ: unsafeLocalizedString('Iraq'),
  IE: unsafeLocalizedString('Irlanda'),
  IS: unsafeLocalizedString('Islanda'),
  BV: unsafeLocalizedString('Isola Bouvet'),
  CX: unsafeLocalizedString('Isola del Natale'),
  IM: unsafeLocalizedString('Isola di Man'),
  NF: unsafeLocalizedString('Isola Norfolk'),
  AX: unsafeLocalizedString('Isole Åland'),
  BQ: unsafeLocalizedString('Isole BES'),
  KY: unsafeLocalizedString('Isole Cayman'),
  CC: unsafeLocalizedString('Isole Cocos e Keeling'),
  CK: unsafeLocalizedString('Isole Cook'),
  FO: unsafeLocalizedString('Isole Fær Øer'),
  FK: unsafeLocalizedString('Isole Falkland'),
  HM: unsafeLocalizedString('Isole Heard e McDonald'),
  MP: unsafeLocalizedString('Isole Marianne Settentrionali'),
  MH: unsafeLocalizedString('Isole Marshall'),
  UM: unsafeLocalizedString('Isole minori esterne degli Stati Uniti'),
  PN: unsafeLocalizedString('Isole Pitcairn'),
  SB: unsafeLocalizedString('Isole Salomone'),
  TC: unsafeLocalizedString('Isole Turks e Caicos'),
  VI: unsafeLocalizedString('Isole Vergini americane'),
  VG: unsafeLocalizedString('Isole Vergini britanniche'),
  IL: unsafeLocalizedString('Israele'),
  IT: unsafeLocalizedString('Italia'),
  JE: unsafeLocalizedString('Jersey'),
  KZ: unsafeLocalizedString('Kazakistan'),
  KE: unsafeLocalizedString('Kenya'),
  KG: unsafeLocalizedString('Kirghizistan'),
  KI: unsafeLocalizedString('Kiribati'),
  KW: unsafeLocalizedString('Kuwait'),
  LA: unsafeLocalizedString('Laos'),
  LS: unsafeLocalizedString('Lesotho'),
  LV: unsafeLocalizedString('Lettonia'),
  LB: unsafeLocalizedString('Libano'),
  LR: unsafeLocalizedString('Liberia'),
  LY: unsafeLocalizedString('Libia'),
  LI: unsafeLocalizedString('Liechtenstein'),
  LT: unsafeLocalizedString('Lituania'),
  LU: unsafeLocalizedString('Lussemburgo'),
  MO: unsafeLocalizedString('Macao'),
  MK: unsafeLocalizedString('Macedonia del Nord'),
  MG: unsafeLocalizedString('Madagascar'),
  MW: unsafeLocalizedString('Malawi'),
  MY: unsafeLocalizedString('Malaysia'),
  MV: unsafeLocalizedString('Maldive'),
  ML: unsafeLocalizedString('Mali'),
  MT: unsafeLocalizedString('Malta'),
  MA: unsafeLocalizedString('Marocco'),
  MQ: unsafeLocalizedString('Martinica'),
  MR: unsafeLocalizedString('Mauritania'),
  MU: unsafeLocalizedString('Mauritius'),
  YT: unsafeLocalizedString('Mayotte'),
  MX: unsafeLocalizedString('Messico'),
  MD: unsafeLocalizedString('Moldavia'),
  MC: unsafeLocalizedString('Monaco'),
  MN: unsafeLocalizedString('Mongolia'),
  ME: unsafeLocalizedString('Montenegro'),
  MS: unsafeLocalizedString('Montserrat'),
  MZ: unsafeLocalizedString('Mozambico'),
  NA: unsafeLocalizedString('Namibia'),
  NR: unsafeLocalizedString('Nauru'),
  NP: unsafeLocalizedString('Nepal'),
  NI: unsafeLocalizedString('Nicaragua'),
  NE: unsafeLocalizedString('Niger'),
  NG: unsafeLocalizedString('Nigeria'),
  NU: unsafeLocalizedString('Niue'),
  NO: unsafeLocalizedString('Norvegia'),
  NC: unsafeLocalizedString('Nuova Caledonia'),
  NZ: unsafeLocalizedString('Nuova Zelanda'),
  OM: unsafeLocalizedString('Oman'),
  NL: unsafeLocalizedString('Paesi Bassi'),
  PK: unsafeLocalizedString('Pakistan'),
  PW: unsafeLocalizedString('Palau'),
  PA: unsafeLocalizedString('Panama'),
  PG: unsafeLocalizedString('Papua Nuova Guinea'),
  PY: unsafeLocalizedString('Paraguay'),
  PE: unsafeLocalizedString('Perù'),
  PF: unsafeLocalizedString('Polinesia Francese'),
  PL: unsafeLocalizedString('Polonia'),
  PR: unsafeLocalizedString('Porto Rico'),
  PT: unsafeLocalizedString('Portogallo'),
  QA: unsafeLocalizedString('Qatar'),
  GB: unsafeLocalizedString('Regno Unito'),
  CZ: unsafeLocalizedString('Repubblica Ceca'),
  CF: unsafeLocalizedString('Repubblica Centrafricana'),
  CG: unsafeLocalizedString('Repubblica del Congo'),
  CD: unsafeLocalizedString('Repubblica Democratica del Congo'),
  TW: unsafeLocalizedString('Repubblica di Cina'),
  DO: unsafeLocalizedString('Repubblica Dominicana'),
  RE: unsafeLocalizedString('Riunione'),
  RO: unsafeLocalizedString('Romania'),
  RW: unsafeLocalizedString('Ruanda'),
  RU: unsafeLocalizedString('Russia'),
  EH: unsafeLocalizedString('Sahara Occidentale'),
  KN: unsafeLocalizedString('Saint Kitts e Nevis'),
  VC: unsafeLocalizedString('Saint Vincent e Grenadine'),
  BL: unsafeLocalizedString('Saint-Barthélemy'),
  MF: unsafeLocalizedString('Saint-Martin'),
  PM: unsafeLocalizedString('Saint-Pierre e Miquelon'),
  AS: unsafeLocalizedString('Samoa Americane'),
  WS: unsafeLocalizedString('Samoa'),
  SM: unsafeLocalizedString('San Marino'),
  SH: unsafeLocalizedString(
    "Sant'Elena, Isola di Ascensione e Tristan da Cunha"
  ),
  LC: unsafeLocalizedString('Santa Lucia'),
  ST: unsafeLocalizedString('São Tomé e Príncipe'),
  SN: unsafeLocalizedString('Senegal'),
  RS: unsafeLocalizedString('Serbia'),
  SC: unsafeLocalizedString('Seychelles'),
  SL: unsafeLocalizedString('Sierra Leone'),
  SG: unsafeLocalizedString('Singapore'),
  SX: unsafeLocalizedString('Sint Maarten'),
  SY: unsafeLocalizedString('Siria'),
  SK: unsafeLocalizedString('Slovacchia'),
  SI: unsafeLocalizedString('Slovenia'),
  SO: unsafeLocalizedString('Somalia'),
  ES: unsafeLocalizedString('Spagna'),
  LK: unsafeLocalizedString('Sri Lanka'),
  FM: unsafeLocalizedString('Stati Federati di Micronesia'),
  US: unsafeLocalizedString("Stati Uniti d'America"),
  PS: unsafeLocalizedString('Stato di Palestina'),
  ZA: unsafeLocalizedString('Sudafrica'),
  SS: unsafeLocalizedString('Sudan del Sud'),
  SD: unsafeLocalizedString('Sudan'),
  SR: unsafeLocalizedString('Suriname'),
  SJ: unsafeLocalizedString('Svalbard e Jan Mayen'),
  SE: unsafeLocalizedString('Svezia'),
  CH: unsafeLocalizedString('Svizzera'),
  SZ: unsafeLocalizedString('Swaziland'),
  TJ: unsafeLocalizedString('Tagikistan'),
  TZ: unsafeLocalizedString('Tanzania'),
  IO: unsafeLocalizedString("Territori Britannici dell'Oceano Indiano"),
  TF: unsafeLocalizedString('Territori Francesi del Sud'),
  TH: unsafeLocalizedString('Thailandia'),
  TL: unsafeLocalizedString('Timor Est'),
  TG: unsafeLocalizedString('Togo'),
  TK: unsafeLocalizedString('Tokelau'),
  TO: unsafeLocalizedString('Tonga'),
  TT: unsafeLocalizedString('Trinidad e Tobago'),
  TN: unsafeLocalizedString('Tunisia'),
  TR: unsafeLocalizedString('Turchia'),
  TM: unsafeLocalizedString('Turkmenistan'),
  TV: unsafeLocalizedString('Tuvalu'),
  UA: unsafeLocalizedString('Ucraina'),
  UG: unsafeLocalizedString('Uganda'),
  HU: unsafeLocalizedString('Ungheria'),
  UY: unsafeLocalizedString('Uruguay'),
  UZ: unsafeLocalizedString('Uzbekistan'),
  VU: unsafeLocalizedString('Vanuatu'),
  VE: unsafeLocalizedString('Venezuela'),
  VN: unsafeLocalizedString('Vietnam'),
  WF: unsafeLocalizedString('Wallis e Futuna'),
  YE: unsafeLocalizedString('Yemen'),
  ZM: unsafeLocalizedString('Zambia'),
  ZW: unsafeLocalizedString('Zimbabwe')
}

export const Country = t.keyof(CountryValues)
export type Country = t.TypeOf<typeof Country>

export const ClientCreationCommonInput = t.type(
  {
    address_country: Country,
    address_province: Province,
    address_city: NonEmptyString,
    address_zip: NonEmptyString,
    address_street: NonEmptyString,
    address_street_number: optionFromNullable(NonEmptyString),
    address_email: EmailString
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
      fiscal_code: NonEmptyString,
      first_name: NonEmptyString,
      last_name: NonEmptyString
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
      country_code: Country,
      vat_number: NonEmptyString,
      business_name: NonEmptyString
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

export function foldClientCreationInput<T>(
  whenPrivate: (input: PrivateClientCreationInput) => T,
  whenBusiness: (input: BusinessClientCreationInput) => T
): (input: ClientCreationInput) => T {
  return input => {
    switch (input.type) {
      case 'PRIVATE':
        return whenPrivate(input)
      case 'BUSINESS':
        return whenBusiness(input)
    }
  }
}

const ClientData = t.type(
  {
    id: PositiveInteger,
    created_at: DateFromISOString,
    updated_at: DateFromISOString
  },
  'ClientData'
)

const PrivateClient = t.intersection(
  [PrivateClientCreationInput, ClientData],
  'PrivateClient'
)
type PrivateClient = t.TypeOf<typeof PrivateClient>

const BusinessClient = t.intersection(
  [BusinessClientCreationInput, ClientData],
  'BusinessClient'
)
type BusinessClient = t.TypeOf<typeof BusinessClient>

export const Client = t.union([PrivateClient, BusinessClient], 'Client')
export type Client = t.TypeOf<typeof Client>

export function foldClient<T>(
  whenPrivate: (client: PrivateClient) => T,
  whenBusiness: (client: BusinessClient) => T
): (client: Client) => T {
  return client => {
    switch (client.type) {
      case 'PRIVATE':
        return whenPrivate(client)
      case 'BUSINESS':
        return whenBusiness(client)
    }
  }
}
