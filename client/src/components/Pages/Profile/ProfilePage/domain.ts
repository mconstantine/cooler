import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePostRequest,
  makePutRequest
} from '../../../../effects/api/useApi'
import { TaxCreationInput, TaxUpdateInput } from '../../../../entities/Tax'
import {
  EmailString,
  LocalizedString,
  NonNegativeNumber,
  Percentage,
  PositiveInteger
} from '../../../../globalDomain'
import { Connection } from '../../../../misc/Connection'

const Tax = t.type({
  id: PositiveInteger,
  label: LocalizedString,
  value: Percentage
})

const Profile = t.type(
  {
    id: PositiveInteger,
    name: LocalizedString,
    email: EmailString,
    created_at: DateFromISOString,
    updated_at: DateFromISOString,
    expectedWorkingHours: NonNegativeNumber,
    actualWorkingHours: NonNegativeNumber,
    budget: NonNegativeNumber,
    balance: NonNegativeNumber,
    cashedBalance: NonNegativeNumber,
    taxes: Connection(Tax)
  },
  'Profile'
)
export type Profile = t.TypeOf<typeof Profile>

export const profileQuery = makeGetRequest({
  url: '/profile',
  inputCodec: t.void,
  outputCodec: Profile
})

export const ProfileUpdateInput = t.type(
  {
    name: LocalizedString,
    email: EmailString,
    password: optionFromNullable(NonEmptyString)
  },
  'UserUpdateInput'
)
export type ProfileUpdateInput = t.TypeOf<typeof ProfileUpdateInput>

export const updateProfileRequest = makePutRequest({
  url: '/profile',
  inputCodec: ProfileUpdateInput,
  outputCodec: Profile
})

export const deleteProfileRequest = makeDeleteRequest({
  url: '/profile',
  inputCodec: t.void,
  outputCodec: Profile
})

export const createTaxRequest = makePostRequest({
  url: '/taxes',
  inputCodec: TaxCreationInput,
  outputCodec: Tax
})

export const makeUdateTaxRequest = (id: PositiveInteger) =>
  makePutRequest({
    url: `/taxes/${id}`,
    inputCodec: TaxUpdateInput,
    outputCodec: Tax
  })

export const makeDeleteTaxRequest = (id: PositiveInteger) =>
  makeDeleteRequest({
    url: `/taxes/${id}`,
    inputCodec: t.void,
    outputCodec: Tax
  })
