import {
  DatabaseTask,
  Task,
  TaskCreationInput,
  TasksBatchCreationInput,
  TaskUpdateInput
} from './interface'
import { DatabaseProject, Project } from '../project/interface'
import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  getTask,
  getTaskProject,
  getUserTasks,
  getProjectTasks,
  createTasksBatch
} from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { DatabaseUser } from '../user/interface'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'
import { createResolver } from '../misc/createResolver'
import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { PositiveInteger } from '../misc/Types'

const taskProjectResolver = createResolver<DatabaseTask>(
  t.void,
  Project,
  getTaskProject
)

export const UserTasksConnectionQueryArgs = t.intersection(
  [
    ConnectionQueryArgs,
    t.type({
      from: optionFromNullable(DateFromISOString),
      to: optionFromNullable(DateFromISOString)
    })
  ],
  'UserTasksConnectionQueryArgs'
)
export type UserTasksConnectionQueryArgs = t.TypeOf<
  typeof UserTasksConnectionQueryArgs
>
const userTasksResolver = createResolver<DatabaseUser>(
  UserTasksConnectionQueryArgs,
  Connection(Task),
  getUserTasks
)

const projectTasksResolver = createResolver<DatabaseProject>(
  ConnectionQueryArgs,
  Connection(Task),
  getProjectTasks
)

const CreateTaskMutationInput = t.type(
  {
    task: TaskCreationInput
  },
  'CreateTaskMutationInput'
)
const createTaskMutation = createResolver(
  CreateTaskMutationInput,
  Task,
  (_parent, { task }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createTask(task, user))
    )
)

const CreateTasksBatchMutationInput = t.type(
  {
    input: TasksBatchCreationInput
  },
  'CreateTasksBatchMutationInput'
)
const createTasksBatchMutation = createResolver(
  CreateTasksBatchMutationInput,
  Project,
  (_parent, { input }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createTasksBatch(input, user))
    )
)

const UpdateTaskMutationInput = t.type(
  {
    id: PositiveInteger,
    task: TaskUpdateInput
  },
  'UpdateTaskMutationInput'
)
const updateTaskMutation = createResolver(
  UpdateTaskMutationInput,
  Task,
  (_parent, { id, task }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateTask(id, task, user))
    )
)

const DeleteTaskMutationInput = t.type(
  {
    id: PositiveInteger
  },
  'DeleteTaskMutationInput'
)
const deleteTaskMutation = createResolver(
  DeleteTaskMutationInput,
  Task,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteTask(id, user))
    )
)

const TaskQueryInput = t.type(
  {
    id: PositiveInteger
  },
  'TaskQueryInput'
)
const taskQuery = createResolver(
  TaskQueryInput,
  Task,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getTask(id, user))
    )
)

export const TasksConnectionQueryArgs = t.intersection(
  [
    ConnectionQueryArgs,
    t.type({
      name: optionFromNullable(NonEmptyString)
    })
  ],
  'TasksConnectionQueryArgs'
)
export type TasksConnectionQueryArgs = t.TypeOf<typeof TasksConnectionQueryArgs>
const tasksQuery = createResolver(
  TasksConnectionQueryArgs,
  Connection(Task),
  (_parent, args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listTasks(args, user))
    )
)

const resolvers = {
  Task: {
    project: taskProjectResolver
  },
  User: {
    tasks: userTasksResolver
  },
  Project: {
    tasks: projectTasksResolver
  },
  Mutation: {
    createTask: createTaskMutation,
    createTasksBatch: createTasksBatchMutation,
    updateTask: updateTaskMutation,
    deleteTask: deleteTaskMutation
  },
  Query: {
    task: taskQuery,
    tasks: tasksQuery
  }
}

export default resolvers
