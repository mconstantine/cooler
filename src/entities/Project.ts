import * as t from 'io-ts'
import {
  DateFromISOString,
  option as optionCodec,
  optionFromNullable
} from 'io-ts-types'
import { LocalizedString, NonNegativeNumber, ObjectId } from '../globalDomain'

const Client = t.type(
  {
    _id: ObjectId,
    name: LocalizedString
  },
  'Client'
)

const ProjectCashData = t.type(
  {
    at: DateFromISOString,
    amount: t.number
  },
  'ProjectCashData'
)
export type ProjectCashData = t.TypeOf<typeof ProjectCashData>

export const Project = t.type(
  {
    _id: ObjectId,
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    client: Client,
    cashData: optionFromNullable(ProjectCashData),
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
    description: optionCodec(LocalizedString),
    client: ObjectId,
    cashData: optionFromNullable(ProjectCashData)
  },
  'ProjectCreationInput'
)
export type ProjectCreationInput = t.TypeOf<typeof ProjectCreationInput>
