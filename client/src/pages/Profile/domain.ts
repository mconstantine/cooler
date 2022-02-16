import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import {
  makeDeleteRequest,
  makeGetRequest,
  makePutRequest
} from '../../effects/api/useApi'
import {
  EmailString,
  LocalizedString,
  NonNegativeNumber,
  PositiveInteger
} from '../../globalDomain'

const Profile = t.type(
  {
    id: PositiveInteger,
    name: LocalizedString,
    email: EmailString,
    created_at: DateFromISOString,
    updated_at: DateFromISOString
  },
  'Profile'
)
export type Profile = t.TypeOf<typeof Profile>

const ProfileStatsQueryInput = t.type(
  {
    since: DateFromISOString
  },
  'ProfileStatsQueryInput'
)
export type ProfileStatsQueryInput = t.TypeOf<typeof ProfileStatsQueryInput>

const ProfileStats = t.type(
  {
    expectedWorkingHours: NonNegativeNumber,
    actualWorkingHours: NonNegativeNumber,
    budget: NonNegativeNumber,
    balance: NonNegativeNumber
  },
  'UserStatsQueryOutput'
)

export const getProfileRequest = makeGetRequest({
  url: '/profile',
  inputCodec: t.void,
  outputCodec: Profile
})

export const getProfileStatsRequest = makeGetRequest({
  url: '/profile/stats',
  inputCodec: ProfileStatsQueryInput,
  outputCodec: ProfileStats
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
