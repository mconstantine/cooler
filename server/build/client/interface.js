"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.foldClient = exports.foldClientUpdateInput = exports.foldClientCreationInput = exports.ClientUpdateInput = exports.BusinessClientUpdateInput = exports.PrivateClientUpdateInput = exports.ClientUpdateCommonInput = exports.ClientCreationInput = exports.BusinessClientCreationInput = exports.PrivateClientCreationInput = exports.ClientCreationCommonInput = exports.DatabaseClient = exports.Client = exports.BusinessDatabaseClient = exports.PrivateDatabaseClient = exports.BusinessClient = exports.PrivateClient = exports.Country = exports.Province = exports.ClientType = void 0;
var t = __importStar(require("io-ts"));
var io_ts_types_1 = require("io-ts-types");
var Types_1 = require("../misc/Types");
exports.ClientType = t.keyof({
    PRIVATE: true,
    BUSINESS: true
});
exports.Province = t.keyof({
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
}, 'Province');
exports.Country = t.keyof({
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
}, 'Country');
var ClientCommonData = t.type({
    id: Types_1.PositiveInteger,
    address_country: exports.Country,
    address_province: exports.Province,
    address_city: io_ts_types_1.NonEmptyString,
    address_zip: io_ts_types_1.NonEmptyString,
    address_street: io_ts_types_1.NonEmptyString,
    address_street_number: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    address_email: Types_1.EmailString,
    user: Types_1.PositiveInteger
}, 'ClientCommonData');
var ClientData = t.intersection([
    ClientCommonData,
    t.type({
        created_at: io_ts_types_1.DateFromISOString,
        updated_at: io_ts_types_1.DateFromISOString
    })
], 'ClientData');
var DatabaseClientData = t.intersection([
    ClientCommonData,
    t.type({
        created_at: Types_1.DateFromSQLDate,
        updated_at: Types_1.DateFromSQLDate
    })
], 'DatabaseClientData');
var PrivateClientData = t.type({
    type: t.literal('PRIVATE'),
    fiscal_code: io_ts_types_1.NonEmptyString,
    first_name: io_ts_types_1.NonEmptyString,
    last_name: io_ts_types_1.NonEmptyString
}, 'PrivateClientData');
var BusinessClientData = t.type({
    type: t.literal('BUSINESS'),
    country_code: exports.Country,
    vat_number: io_ts_types_1.NonEmptyString,
    business_name: io_ts_types_1.NonEmptyString
}, 'BusinessClientData');
exports.PrivateClient = t.intersection([ClientData, PrivateClientData], 'PrivateClient');
exports.BusinessClient = t.intersection([ClientData, BusinessClientData], 'BusinessClient');
exports.PrivateDatabaseClient = t.intersection([DatabaseClientData, PrivateClientData], 'PrivateDatabaseClient');
exports.BusinessDatabaseClient = t.intersection([DatabaseClientData, BusinessClientData], 'BusinessDatabaseClient');
exports.Client = t.union([exports.PrivateClient, exports.BusinessClient], 'Client');
exports.DatabaseClient = t.union([exports.PrivateDatabaseClient, exports.BusinessDatabaseClient], 'DatabaseClient');
exports.ClientCreationCommonInput = t.type({
    address_country: exports.Country,
    address_province: exports.Province,
    address_city: io_ts_types_1.NonEmptyString,
    address_zip: io_ts_types_1.NonEmptyString,
    address_street: io_ts_types_1.NonEmptyString,
    address_street_number: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
    address_email: Types_1.EmailString
}, 'ClientCreationCommonInput');
exports.PrivateClientCreationInput = t.intersection([
    exports.ClientCreationCommonInput,
    t.type({
        type: t.literal('PRIVATE'),
        fiscal_code: io_ts_types_1.NonEmptyString,
        first_name: io_ts_types_1.NonEmptyString,
        last_name: io_ts_types_1.NonEmptyString
    }, 'PrivateClientCreationInput')
]);
exports.BusinessClientCreationInput = t.intersection([
    exports.ClientCreationCommonInput,
    t.type({
        type: t.literal('BUSINESS'),
        country_code: exports.Country,
        vat_number: io_ts_types_1.NonEmptyString,
        business_name: io_ts_types_1.NonEmptyString
    })
], 'BusinessClientCreationInput');
exports.ClientCreationInput = t.union([exports.PrivateClientCreationInput, exports.BusinessClientCreationInput], 'ClientCreationInput');
exports.ClientUpdateCommonInput = t.partial({
    user: Types_1.PositiveInteger,
    address_country: exports.Country,
    address_province: exports.Province,
    address_city: io_ts_types_1.NonEmptyString,
    address_zip: io_ts_types_1.NonEmptyString,
    address_street: io_ts_types_1.NonEmptyString,
    address_street_number: Types_1.optionFromNull(io_ts_types_1.NonEmptyString),
    address_email: Types_1.EmailString
}, 'ClientUpdateCommonInput');
exports.PrivateClientUpdateInput = t.intersection([
    exports.ClientUpdateCommonInput,
    t.partial({
        type: t.literal('PRIVATE'),
        fiscal_code: io_ts_types_1.NonEmptyString,
        first_name: io_ts_types_1.NonEmptyString,
        last_name: io_ts_types_1.NonEmptyString
    })
], 'PrivateClientUpdateInput');
exports.BusinessClientUpdateInput = t.intersection([
    exports.ClientUpdateCommonInput,
    t.partial({
        type: t.literal('BUSINESS'),
        country_code: exports.Country,
        vat_number: io_ts_types_1.NonEmptyString,
        business_name: io_ts_types_1.NonEmptyString,
        address_country: exports.Country,
        address_province: exports.Province,
        address_city: io_ts_types_1.NonEmptyString,
        address_zip: io_ts_types_1.NonEmptyString,
        address_street: io_ts_types_1.NonEmptyString,
        address_street_number: io_ts_types_1.optionFromNullable(io_ts_types_1.NonEmptyString),
        address_email: Types_1.EmailString
    })
], 'BusinessClientUpdateInput');
exports.ClientUpdateInput = t.union([exports.PrivateClientUpdateInput, exports.BusinessClientUpdateInput], 'ClientUpdateInput');
function foldClientCreationInput(whenPrivate, whenBusiness) {
    return function (input) {
        switch (input.type) {
            case 'PRIVATE':
                return whenPrivate(input);
            case 'BUSINESS':
                return whenBusiness(input);
        }
    };
}
exports.foldClientCreationInput = foldClientCreationInput;
function foldClientUpdateInput(whenPrivate, whenBusiness) {
    return function (input) {
        switch (input.type) {
            case 'PRIVATE':
                return whenPrivate(input);
            case 'BUSINESS':
                return whenBusiness(input);
        }
    };
}
exports.foldClientUpdateInput = foldClientUpdateInput;
function foldClient(whenPrivate, whenBusiness) {
    return function (client) {
        switch (client.type) {
            case 'PRIVATE':
                return whenPrivate(client);
            case 'BUSINESS':
                return whenBusiness(client);
        }
    };
}
exports.foldClient = foldClient;
