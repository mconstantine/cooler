import {
  Task,
  TaskCreationInput,
  TasksBatchCreationInput,
  TaskUpdateInput
} from './interface'
import { Project } from '../project/interface'
import {
  createTask,
  listTasks,
  updateTask,
  deleteTask,
  getTask,
  createTasksBatch
} from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'
import { createResolver } from '../misc/createResolver'
import * as t from 'io-ts'
import { NonEmptyString, optionFromNullable } from 'io-ts-types'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { IdInput } from '../misc/Types'
import { Resolvers } from '../assignResolvers'

const createTaskResolver = createResolver(
  {
    body: TaskCreationInput,
    output: Task
  },
  ({ body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createTask(body, user))
    )
)

const createTasksBatchResolver = createResolver(
  {
    body: TasksBatchCreationInput,
    output: Project
  },
  ({ body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createTasksBatch(body, user))
    )
)

const updateTaskResolver = createResolver(
  {
    params: IdInput,
    body: TaskUpdateInput,
    output: Task
  },
  ({ params: { id }, body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateTask(id, body, user))
    )
)

const deleteTaskResolver = createResolver(
  {
    params: IdInput,
    output: Task
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteTask(id, user))
    )
)

const getTaskResolver = createResolver(
  { params: IdInput, output: Task },
  ({ params: { id } }, context) =>
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

const getTasksResolver = createResolver(
  {
    query: TasksConnectionQueryArgs,
    output: Connection(Task)
  },
  ({ query }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listTasks(query, user))
    )
)

const resolvers: Resolvers = {
  path: '/tasks',
  POST: {
    '/': createTaskResolver,
    '/batch': createTasksBatchResolver
  },
  PUT: {
    '/:id': updateTaskResolver
  },
  DELETE: {
    '/:id': deleteTaskResolver
  },
  GET: {
    '/:id': getTaskResolver,
    '/': getTasksResolver
  }
}

export default resolvers
