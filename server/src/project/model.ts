import {
  DatabaseProject,
  Project,
  ProjectCreationInput,
  ProjectUpdateInput
} from './interface'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { DatabaseUser, User } from '../user/interface'
import { DatabaseClient } from '../client/interface'
import { ApolloError } from 'apollo-server-express'
import { Connection } from '../misc/Connection'
import {
  coolerError,
  DateFromSQLDate,
  NonNegativeNumber,
  PositiveInteger
} from '../misc/Types'
import { TaskEither } from 'fp-ts/TaskEither'
import { constVoid, pipe } from 'fp-ts/function'
import { getClientById } from '../client/database'
import { boolean, option, taskEither } from 'fp-ts'
import { getProjectById } from './database'
import * as t from 'io-ts'
import {
  insertProject,
  updateProject as updateDatabaseProject,
  deleteProject as deleteDatabaseProject
} from './database'
import { Option } from 'fp-ts/Option'
import { dbGet } from '../misc/dbUtils'
import { ProjectConnectionQueryArgs } from './resolvers'
import { a18n } from '../misc/a18n'

export function createProject(
  { name, description, client }: ProjectCreationInput,
  user: User
): TaskEither<ApolloError, Project> {
  return pipe(
    getClientById(client),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The client was not found`)
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        client => client.user === user.id,
        () =>
          coolerError(
            'COOLER_403',
            a18n`You cannot create projects for this client`
          )
      )
    ),
    taskEither.chain(() =>
      insertProject({ name, description, client, cashed: option.none })
    ),
    taskEither.chain(id => getProjectById(id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`Unable to retrieve the project after creation`
        )
      )
    )
  )
}

export function getProject(
  id: PositiveInteger,
  user: User
): TaskEither<ApolloError, Project> {
  return pipe(
    getProjectById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The project you are looking for was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        project => project.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot see this project`)
      )
    )
  )
}

export function listProjects(
  args: ProjectConnectionQueryArgs,
  user: User
): TaskEither<ApolloError, Connection<Project>> {
  const sql = SQL`
    JOIN client ON project.client = client.id
    WHERE client.user = ${user.id}
  `

  pipe(
    args.name,
    option.fold(constVoid, name =>
      sql.append(SQL` AND project.name LIKE ${`%${name}%`}`)
    )
  )

  return queryToConnection(
    args,
    ['project.*, client.user'],
    'project',
    DatabaseProject,
    sql
  )
}

export function updateProject(
  id: PositiveInteger,
  project: ProjectUpdateInput,
  user: User
): TaskEither<ApolloError, Project> {
  const { name, description, client, cashed } = project

  return pipe(
    getProjectById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The project you want to update was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        project => project.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot update this project`)
      )
    ),
    taskEither.chain(project =>
      pipe(
        client !== undefined,
        boolean.fold(
          () => taskEither.right(void 0),
          () =>
            pipe(
              getClientById(client!),
              taskEither.chain(
                taskEither.fromOption(() =>
                  coolerError('COOLER_404', a18n`The new client was not found`)
                )
              ),
              taskEither.chain(
                taskEither.fromPredicate(
                  client => client.user === user.id,
                  () =>
                    coolerError(
                      'COOLER_403',
                      a18n`You cannot assign this client to a project`
                    )
                )
              ),
              taskEither.map(constVoid)
            )
        ),
        taskEither.chain(() =>
          updateDatabaseProject(project.id, {
            name,
            description,
            client,
            cashed
          })
        ),
        taskEither.chain(() => getProjectById(project.id)),
        taskEither.chain(
          taskEither.fromOption(() =>
            coolerError(
              'COOLER_500',
              a18n`Unable to retrieve the project after update`
            )
          )
        )
      )
    )
  )
}

export function deleteProject(
  id: PositiveInteger,
  user: User
): TaskEither<ApolloError, Project> {
  return pipe(
    getProjectById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The project you want to delete was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        project => project.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot delete this project`)
      )
    ),
    taskEither.chain(project =>
      pipe(
        deleteDatabaseProject(project.id),
        taskEither.map(() => project)
      )
    )
  )
}

export function getProjectClient(
  project: DatabaseProject
): TaskEither<ApolloError, DatabaseClient> {
  return pipe(
    getClientById(project.client),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The client of this project was not found`
        )
      )
    )
  )
}

export function getUserProjects(
  user: DatabaseUser,
  args: ConnectionQueryArgs
): TaskEither<ApolloError, Connection<DatabaseProject>> {
  return queryToConnection(
    args,
    ['project.*', 'client.user'],
    'project',
    DatabaseProject,
    SQL`
      JOIN client ON client.id = project.client
      WHERE client.user = ${user.id}
    `
  )
}

export function getUserCashedBalance(
  user: DatabaseUser,
  since: Option<Date>
): TaskEither<ApolloError, NonNegativeNumber> {
  const sql = SQL`
    SELECT IFNULL(SUM(project.cashed_balance), 0) AS balance
    FROM project
    JOIN client ON client.id = project.client
    WHERE client.user = ${user.id} AND project.cashed_balance IS NOT NULL
  `

  pipe(
    since,
    option.fold(constVoid, since =>
      sql.append(
        SQL` AND project.cashed_at >= ${DateFromSQLDate.encode(since)}`
      )
    )
  )

  const Result = t.type({
    balance: NonNegativeNumber
  })

  return pipe(
    dbGet(sql, Result),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`Unable to retrieve the balance of the user`
        )
      )
    ),
    taskEither.map(({ balance }) => balance)
  )
}

export function getClientProjects(
  client: DatabaseClient,
  args: ConnectionQueryArgs
): TaskEither<ApolloError, Connection<DatabaseProject>> {
  return queryToConnection(
    args,
    ['*'],
    'project',
    DatabaseProject,
    SQL`WHERE client = ${client.id}`
  )
}
