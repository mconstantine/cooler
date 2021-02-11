import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import {
  LocalizedString,
  NonNegativeInteger,
  NonNegativeNumber,
  PositiveInteger
} from '../globalDomain'

const Project = t.type({
  id: PositiveInteger,
  name: LocalizedString
})

export const Task = t.type(
  {
    id: PositiveInteger,
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    expectedWorkingHours: NonNegativeNumber,
    actualWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber,
    project: Project,
    start_time: DateFromISOString,
    created_at: DateFromISOString,
    updated_at: DateFromISOString
  },
  'Task'
)
export type Task = t.TypeOf<typeof Task>

export const TaskCreationInput = t.type(
  {
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    expectedWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber,
    project: PositiveInteger,
    start_time: DateFromISOString
  },
  'TaskCreationInput'
)
export type TaskCreationInput = t.TypeOf<typeof TaskCreationInput>

export const TasksBatchCreationInput = t.type(
  {
    name: LocalizedString,
    expectedWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber,
    project: PositiveInteger,
    start_time: DateFromISOString,
    from: DateFromISOString,
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
