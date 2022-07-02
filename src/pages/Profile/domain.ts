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
  ObjectId
} from '../../globalDomain'
import { Task } from '../../entities/Task'
import { Connection, ConnectionQueryInput } from '../../misc/Connection'
import { Project } from '../../entities/Project'

const Profile = t.type(
  {
    _id: ObjectId,
    name: LocalizedString,
    email: EmailString,
    createdAt: DateFromISOString,
    updatedAt: DateFromISOString
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
  url: '/users/me',
  inputCodec: t.void,
  outputCodec: Profile
})

export const getProfileStatsRequest = makeGetRequest({
  url: '/users/stats',
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

const TasksDueTodayInput = t.type(
  {
    from: DateFromISOString,
    to: DateFromISOString
  },
  'TasksDueTodayInput'
)

export const getTasksDueTodayRequest = makeGetRequest({
  url: '/tasks/due',
  inputCodec: TasksDueTodayInput,
  outputCodec: t.array(Task)
})

const CashedBalanceRequestInput = t.type(
  {
    since: DateFromISOString
  },
  'CashedBalanceRequestInput'
)
export type CashedBalanceRequestInput = t.TypeOf<
  typeof CashedBalanceRequestInput
>

const CashedBalanceRequestOutput = t.type(
  {
    balance: NonNegativeNumber
  },
  'CashedBalanceRequestOutput'
)

export const getCashedBalanceRequest = makeGetRequest({
  url: '/projects/cashedBalance',
  inputCodec: CashedBalanceRequestInput,
  outputCodec: CashedBalanceRequestOutput
})

export const getLatestProjectsRequest = makeGetRequest({
  url: '/projects/latest',
  inputCodec: ConnectionQueryInput,
  outputCodec: Connection(Project)
})
