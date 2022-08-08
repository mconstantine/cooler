import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import { LocalizedString, NonNegativeNumber, ObjectId } from '../globalDomain'

const PrivateClientType = t.literal('PRIVATE', 'PrivateClientType')
const BusinessClientType = t.literal('BUSINESS', 'BusinessClientType')

export const ClientType = t.union(
  [PrivateClientType, BusinessClientType],
  'ClientType'
)
export type ClientType = t.TypeOf<typeof ClientType>

export const ClientLabel = t.type(
  {
    _id: ObjectId,
    type: ClientType,
    name: LocalizedString
  },
  'Client'
)

const ProjectCashData = t.type(
  {
    at: DateFromISOString,
    amount: NonNegativeNumber
  },
  'ProjectCashData'
)
export type ProjectCashData = t.TypeOf<typeof ProjectCashData>

export const Project = t.type(
  {
    _id: ObjectId,
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    client: ClientLabel,
    expectedBudget: optionFromNullable(NonNegativeNumber),
    cashData: optionFromNullable(ProjectCashData),
    startTime: DateFromISOString,
    endTime: DateFromISOString,
    createdAt: DateFromISOString,
    updatedAt: DateFromISOString
  },
  'ProjectData'
)
export type Project = t.TypeOf<typeof Project>

export const ProjectWithStats = t.intersection(
  [
    Project,
    t.type({
      expectedWorkingHours: NonNegativeNumber,
      actualWorkingHours: NonNegativeNumber,
      budget: NonNegativeNumber,
      balance: NonNegativeNumber
    })
  ],
  'ProjectWithClient'
)
export type ProjectWithStats = t.TypeOf<typeof ProjectWithStats>

export const ProjectCreationInput = t.type(
  {
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    client: ObjectId,
    expectedBudget: optionFromNullable(NonNegativeNumber),
    cashData: optionFromNullable(ProjectCashData),
    startTime: DateFromISOString,
    endTime: DateFromISOString
  },
  'ProjectCreationInput'
)
export type ProjectCreationInput = t.TypeOf<typeof ProjectCreationInput>
