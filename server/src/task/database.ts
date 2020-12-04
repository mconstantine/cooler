import { ApolloError } from 'apollo-server-express'
import { Option } from 'fp-ts/Option'
import { TaskEither } from 'fp-ts/TaskEither'
import SQL from 'sql-template-strings'
import { dbGet, insert, remove, update } from '../misc/dbUtils'
import { PositiveInteger } from '../misc/Types'
import { TaskCreationInput, TaskUpdateInput, DatabaseTask } from './interface'

export function insertTask(
  task: TaskCreationInput
): TaskEither<ApolloError, PositiveInteger> {
  return insert('task', task, TaskCreationInput)
}

export function updateTask(
  id: PositiveInteger,
  task: TaskUpdateInput
): TaskEither<ApolloError, PositiveInteger> {
  return update('task', id, task, TaskUpdateInput)
}

export function deleteTask(
  id: PositiveInteger
): TaskEither<ApolloError, PositiveInteger> {
  return remove('task', { id })
}

export function getTaskById(
  id: PositiveInteger
): TaskEither<ApolloError, Option<DatabaseTask>> {
  return dbGet(
    SQL`
      SELECT task.*, client.user
      FROM task
      JOIN project ON project.id = task.project
      JOIN client ON client.id = project.client
      WHERE task.id = ${id}
    `,
    DatabaseTask
  )
}
