import { Connection } from '../misc/Connection'
import { Project } from '../project/Project'

export interface Client {
  id: number
  type: ClientType
  fiscal_code?: string | null
  first_name?: string | null
  last_name?: string | null
  country_code?: string | null
  vat_number?: string | null
  business_name?: string | null
  address_country: string
  address_province: string
  address_city: string
  address_zip: string
  address_street: string
  address_street_number: string
  address_email: string
  user: number
  created_at: string
  updated_at: string
  projects?: Connection<Project>
}

export enum ClientType {
  PRIVATE = 'PRIVATE',
  BUSINESS = 'BUSINESS'
}

export enum Province {
  'AG' = 'Agrigento',
  'AL' = 'Alessandria',
  'AN' = 'Ancona',
  'AO' = 'Aosta',
  'AQ' = "L'Aquila",
  'AR' = 'Arezzo',
  'AP' = 'Ascoli-Piceno',
  'AT' = 'Asti',
  'AV' = 'Avellino',
  'BA' = 'Bari',
  'BT' = 'Barletta-Andria-Trani',
  'BL' = 'Belluno',
  'BN' = 'Benevento',
  'BG' = 'Bergamo',
  'BI' = 'Biella',
  'BO' = 'Bologna',
  'BZ' = 'Bolzano',
  'BS' = 'Brescia',
  'BR' = 'Brindisi',
  'CA' = 'Cagliari',
  'CL' = 'Caltanissetta',
  'CB' = 'Campobasso',
  'CI' = 'Carbonia Iglesias',
  'CE' = 'Caserta',
  'CT' = 'Catania',
  'CZ' = 'Catanzaro',
  'CH' = 'Chieti',
  'CO' = 'Como',
  'CS' = 'Cosenza',
  'CR' = 'Cremona',
  'KR' = 'Crotone',
  'CN' = 'Cuneo',
  'EN' = 'Enna',
  'FM' = 'Fermo',
  'FE' = 'Ferrara',
  'FI' = 'Firenze',
  'FG' = 'Foggia',
  'FC' = 'Forli-Cesena',
  'FR' = 'Frosinone',
  'GE' = 'Genova',
  'GO' = 'Gorizia',
  'GR' = 'Grosseto',
  'IM' = 'Imperia',
  'IS' = 'Isernia',
  'SP' = 'La-Spezia',
  'LT' = 'Latina',
  'LE' = 'Lecce',
  'LC' = 'Lecco',
  'LI' = 'Livorno',
  'LO' = 'Lodi',
  'LU' = 'Lucca',
  'MC' = 'Macerata',
  'MN' = 'Mantova',
  'MS' = 'Massa-Carrara',
  'MT' = 'Matera',
  'VS' = 'Medio Campidano',
  'ME' = 'Messina',
  'MI' = 'Milano',
  'MO' = 'Modena',
  'MB' = 'Monza-Brianza',
  'NA' = 'Napoli',
  'NO' = 'Novara',
  'NU' = 'Nuoro',
  'OG' = 'Ogliastra',
  'OT' = 'Olbia Tempio',
  'OR' = 'Oristano',
  'PD' = 'Padova',
  'PA' = 'Palermo',
  'PR' = 'Parma',
  'PV' = 'Pavia',
  'PG' = 'Perugia',
  'PU' = 'Pesaro-Urbino',
  'PE' = 'Pescara',
  'PC' = 'Piacenza',
  'PI' = 'Pisa',
  'PT' = 'Pistoia',
  'PN' = 'Pordenone',
  'PZ' = 'Potenza',
  'PO' = 'Prato',
  'RG' = 'Ragusa',
  'RA' = 'Ravenna',
  'RC' = 'Reggio-Calabria',
  'RE' = 'Reggio-Emilia',
  'RI' = 'Rieti',
  'RN' = 'Rimini',
  'RO' = 'Rovigo',
  'SA' = 'Salerno',
  'SS' = 'Sassari',
  'SV' = 'Savona',
  'SI' = 'Siena',
  'SR' = 'Siracusa',
  'SO' = 'Sondrio',
  'TA' = 'Taranto',
  'TE' = 'Teramo',
  'TR' = 'Terni',
  'TO' = 'Torino',
  'TP' = 'Trapani',
  'TN' = 'Trento',
  'TV' = 'Treviso',
  'TS' = 'Trieste',
  'UD' = 'Udine',
  'VA' = 'Varese',
  'VE' = 'Venezia',
  'VB' = 'Verbania',
  'VC' = 'Vercelli',
  'VR' = 'Verona',
  'VV' = 'Vibo-Valentia',
  'VI' = 'Vicenza',
  'VT' = 'Viterbo'
}
