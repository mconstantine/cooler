import * as t from 'io-ts'
import { DateFromISOString, optionFromNullable } from 'io-ts-types'
import {
  LocalizedString,
  NonNegativeInteger,
  NonNegativeNumber,
  ObjectId
} from '../globalDomain'
import { ClientLabel } from './Project'

export const ProjectLabel = t.type({
  _id: ObjectId,
  name: LocalizedString
})
export type ProjectLabel = t.TypeOf<typeof ProjectLabel>

export const Task = t.type(
  {
    _id: ObjectId,
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    project: ProjectLabel,
    client: ClientLabel,
    expectedWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber,
    startTime: DateFromISOString,
    createdAt: DateFromISOString,
    updatedAt: DateFromISOString
  },
  'Task'
)
export type Task = t.TypeOf<typeof Task>

export const TaskWithStats = t.intersection(
  [Task, t.type({ actualWorkingHours: NonNegativeNumber })],
  'TaskWithProject'
)
export type TaskWithStats = t.TypeOf<typeof TaskWithStats>

export const TaskCreationInput = t.type(
  {
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    expectedWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber,
    project: ObjectId,
    startTime: DateFromISOString
  },
  'TaskCreationInput'
)
export type TaskCreationInput = t.TypeOf<typeof TaskCreationInput>

export const TasksBatchCreationInput = t.type(
  {
    name: LocalizedString,
    expectedWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber,
    project: ObjectId,
    startTime: DateFromISOString,
    to: DateFromISOString,
    repeat: NonNegativeInteger
  },
  'TasksBatchCreationInput'
)
export type TasksBatchCreationInput = t.TypeOf<typeof TasksBatchCreationInput>

export function isSingleTaskCreationInput(
  input: TaskCreationInput | TasksBatchCreationInput
): input is TaskCreationInput {
  return (input as TaskCreationInput).description !== undefined
}

export function isTasksBatchInput(
  input: TaskCreationInput | TasksBatchCreationInput
): input is TasksBatchCreationInput {
  return (input as TasksBatchCreationInput).repeat !== undefined
}
