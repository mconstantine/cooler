import { ApolloError } from 'apollo-server-express'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { PositiveInteger } from '../misc/Types'
import {
  ProjectCreationInput,
  ProjectUpdateInput,
  DatabaseProject
} from './interface'

export function insertProject(
  project: ProjectCreationInput
): TaskEither<ApolloError, PositiveInteger> {
  return insert('project', project, ProjectCreationInput)
}

export function updateProject(
  id: PositiveInteger,
  project: ProjectUpdateInput
): TaskEither<ApolloError, PositiveInteger> {
  return update('project', id, project, ProjectUpdateInput)
}

export function deleteProject(
  id: PositiveInteger
): TaskEither<ApolloError, PositiveInteger> {
  return remove('project', { id })
}

export function getProjectById(
  id: PositiveInteger
): TaskEither<ApolloError, Option<DatabaseProject>> {
  return dbGet(
    SQL`
      SELECT project.*, client.user
      FROM project
      JOIN client ON client.id = project.client
      WHERE project.id = ${id}
    `,
    DatabaseProject
  )
}
