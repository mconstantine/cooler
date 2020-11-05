import { ID, SQLDate } from '../misc/Types'

interface TaskCommonData {
  readonly id: ID
  name: string
  description: string | null
  expectedWorkingHours: number
  hourlyCost: number
  project: ID
}

export interface Task extends TaskCommonData {
  start_time: Date
  readonly created_at: Date
  readonly updated_at: Date
}

export interface TaskFromDatabase extends TaskCommonData {
  start_time: SQLDate
  readonly created_at: SQLDate
  readonly updated_at: SQLDate
}

export type TaskCreationInput = Omit<
  TaskFromDatabase,
  'id' | 'created_at' | 'updated_at'
>

export interface TasksBatchCreationInput
  extends Pick<
    TaskFromDatabase,
    'name' | 'expectedWorkingHours' | 'hourlyCost' | 'project' | 'start_time'
  > {
  from: SQLDate
  to: SQLDate
  repeat: number
}

export type TaskUpdateInput = Partial<TaskCreationInput>
