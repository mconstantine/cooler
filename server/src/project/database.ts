import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { CoolerError, PositiveInteger } from '../misc/Types'
import {
  ProjectCreationInput,
  ProjectUpdateInput,
  DatabaseProject
} from './interface'

export function insertProject(
  project: ProjectCreationInput
): TaskEither<CoolerError, PositiveInteger> {
  return insert('project', project, ProjectCreationInput)
}

export function updateProject(
  id: PositiveInteger,
  project: ProjectUpdateInput
): TaskEither<CoolerError, PositiveInteger> {
  return update('project', id, project, ProjectUpdateInput)
}

export function deleteProject(
  id: PositiveInteger
): TaskEither<CoolerError, PositiveInteger> {
  return remove('project', { id })
}

export function getProjectById(
  id: PositiveInteger
): TaskEither<CoolerError, Option<DatabaseProject>> {
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
