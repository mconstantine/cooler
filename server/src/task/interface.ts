import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import {
  DateFromSQLDate,
  NonNegativeInteger,
  NonNegativeNumber,
  PositiveInteger
} from '../misc/Types'

const TaskCommonData = t.type(
  {
    id: PositiveInteger,
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    expectedWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber
  },
  'TaskCommonData'
)

const SimpleTaskData = t.intersection(
  [
    TaskCommonData,
    t.type({
      project: PositiveInteger
    })
  ],
  'SimpleTaskData'
)

const TaskWithProjectData = t.intersection(
  [
    TaskCommonData,
    t.type({
      project: t.type(
        {
          id: PositiveInteger,
          name: NonEmptyString
        },
        'Project'
      )
    })
  ],
  'TaskWithProjectData'
)

const TaskInputData = t.type(
  {
    start_time: DateFromISOString,
    created_at: DateFromISOString,
    updated_at: DateFromISOString
  },
  'TaskInputData'
)

const DatabaseTaskData = t.type(
  {
    user: PositiveInteger,
    start_time: DateFromSQLDate,
    created_at: DateFromSQLDate,
    updated_at: DateFromSQLDate
  },
  'DatabaseTaskData'
)

export const Task = t.intersection([SimpleTaskData, TaskInputData], 'Task')
export type Task = t.TypeOf<typeof Task>

export const TaskWithProject = t.intersection(
  [TaskWithProjectData, TaskInputData],
  'TaskWithProject'
)
export type TaskWithProject = t.TypeOf<typeof TaskWithProject>

export const DatabaseTask = t.intersection(
  [SimpleTaskData, DatabaseTaskData],
  'DatabaseTask'
)
export type DatabaseTask = t.TypeOf<typeof DatabaseTask>

export const DatabaseTaskWithProject = t.intersection(
  [TaskWithProjectData, DatabaseTaskData],
  'DatabaseTaskWithProject'
)
export type DatabaseTaskWithProject = t.TypeOf<typeof DatabaseTaskWithProject>

export const TaskCreationInput = t.type(
  {
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    expectedWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber,
    project: PositiveInteger,
    start_time: DateFromSQLDate
  },
  'TaskCreationInput'
)
export type TaskCreationInput = t.TypeOf<typeof TaskCreationInput>

export const TasksBatchCreationInput = t.type(
  {
    name: NonEmptyString,
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

export const TaskUpdateInput = t.partial(
  {
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    expectedWorkingHours: NonNegativeNumber,
    hourlyCost: NonNegativeNumber,
    project: PositiveInteger,
    start_time: DateFromSQLDate
  },
  'TaskUpdateInput'
)
export type TaskUpdateInput = t.TypeOf<typeof TaskUpdateInput>
