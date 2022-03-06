import { Project, ProjectCreationInput, ProjectUpdateInput } from './interface'
import {
  createProject,
  listProjects,
  updateProject,
  deleteProject,
  getProject,
  getUserCashedBalance
} from './model'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'
import * as t from 'io-ts'
import { taskEither } from 'fp-ts'
import { createResolver } from '../misc/createResolver'
import { IdInput, NonNegativeNumber } from '../misc/Types'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import { pipe } from 'fp-ts/function'
import { Resolvers } from '../assignResolvers'

const createProjectResolver = createResolver(
  {
    body: ProjectCreationInput,
    output: Project
  },
  ({ body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createProject(body, user))
    )
)

const updateProjectResolver = createResolver(
  {
    params: IdInput,
    body: ProjectUpdateInput,
    output: Project
  },
  ({ params: { id }, body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateProject(id, body, user))
    )
)

const deleteProjectResolver = createResolver(
  {
    params: IdInput,
    output: Project
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteProject(id, user))
    )
)

const getProjectResolver = createResolver(
  {
    params: IdInput,
    output: Project
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getProject(id, user))
    )
)

export const ProjectConnectionQueryArgs = t.intersection(
  [
    ConnectionQueryArgs,
    t.type({
      name: optionFromNullable(NonEmptyString)
    })
  ],
  'ProjectConnectionQueryArgs'
)
export type ProjectConnectionQueryArgs = t.TypeOf<
  typeof ProjectConnectionQueryArgs
>

const getProjectsResolver = createResolver(
  {
    query: ProjectConnectionQueryArgs,
    output: Connection(Project)
  },
  ({ query }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listProjects(query, user))
    )
)

const CashedBalanceInput = t.type(
  {
    since: optionFromNullable(DateFromISOString)
  },
  'CachedBalanceInput'
)

const CashedBalanceOutput = t.type(
  {
    balance: NonNegativeNumber
  },
  'CachedBalanceOutput'
)

const getCashedBalanceResolver = createResolver(
  {
    query: CashedBalanceInput,
    output: CashedBalanceOutput
  },
  ({ query }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getUserCashedBalance(query.since, user)),
      taskEither.map(balance => ({ balance }))
    )
)

const resolvers: Resolvers = [
  {
    path: '/projects',
    POST: {
      '/': createProjectResolver
    },
    PUT: {
      '/:id': updateProjectResolver
    },
    DELETE: {
      '/:id': deleteProjectResolver
    },
    GET: {
      '/cashedBalance': getCashedBalanceResolver,
      '/:id': getProjectResolver,
      '/': getProjectsResolver
    }
  }
]

export default resolvers
