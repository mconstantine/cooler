import {
  Task,
  TasksBatchCreationInput,
  TaskCreationInput,
  TaskUpdateInput,
  DatabaseTask
} from './interface'
import { dbGetAll } from '../misc/dbUtils'
import SQL from 'sql-template-strings'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { queryToConnection } from '../misc/queryToConnection'
import { DatabaseUser, User } from '../user/interface'
import { Connection } from '../misc/Connection'
import { DatabaseProject, Project } from '../project/interface'
import { TaskEither } from 'fp-ts/TaskEither'
import { constVoid, flow, pipe } from 'fp-ts/function'
import { getProjectById } from '../project/database'
import { option, taskEither } from 'fp-ts'
import {
  CoolerError,
  coolerError,
  DateFromSQLDate,
  PositiveInteger
} from '../misc/Types'
import {
  getTaskById,
  insertTask,
  updateTask as updateDatabaseTask,
  deleteTask as deleteDatabasetask
} from './database'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import * as t from 'io-ts'
import { TasksConnectionQueryArgs } from './resolvers'
import { a18n } from '../misc/a18n'

const UserTasksConnectionQueryArgs = t.intersection(
  [
    ConnectionQueryArgs,
    t.type({
      from: optionFromNullable(DateFromISOString),
      to: optionFromNullable(DateFromISOString)
    })
  ],
  'UserTasksConnectionQueryArgs'
)
type UserTasksConnectionQueryArgs = t.TypeOf<
  typeof UserTasksConnectionQueryArgs
>

export function createTask(
  input: TaskCreationInput,
  user: User
): TaskEither<CoolerError, Task> {
  return pipe(
    getProjectById(input.project),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The project of this task was not found`)
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        project => project.user === user.id,
        () =>
          coolerError(
            'COOLER_403',
            a18n`You cannot create tasks for this project`
          )
      )
    ),
    taskEither.chain(() => insertTask(input)),
    taskEither.chain(id => getTaskById(id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`Unable to retrieve the task after creation`
        )
      )
    )
  )
}

export function createTasksBatch(
  input: TasksBatchCreationInput,
  user: User
): TaskEither<CoolerError, Project> {
  return pipe(
    getProjectById(input.project),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The project of this task was not found`)
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        project => project.user === user.id,
        () =>
          coolerError(
            'COOLER_403',
            a18n`You cannot create tasks for this project`
          )
      )
    ),
    taskEither.chain(project =>
      pipe(
        dbGetAll(
          SQL`
            SELECT start_time
            FROM task
            WHERE project = ${project.id}
          `,
          t.type({ start_time: DateFromSQLDate })
        ),
        taskEither.chain(existingTasks => {
          let result: TaskEither<CoolerError, any> = taskEither.fromIO(
            constVoid
          )

          const days = Math.ceil(
            (input.to.getTime() - input.from.getTime()) / 86400000
          )

          for (let i = 0; i <= days; i++) {
            const start_time = new Date(input.from.getTime() + i * 86400000)

            if (
              existingTasks.find(
                task =>
                  task.start_time.getFullYear() === start_time.getFullYear() &&
                  task.start_time.getMonth() === start_time.getMonth() &&
                  task.start_time.getDate() === start_time.getDate()
              )
            ) {
              continue
            }

            start_time.setHours(input.start_time.getHours())
            start_time.setMinutes(input.start_time.getMinutes())
            start_time.setSeconds(input.start_time.getSeconds())

            const weekday = start_time.getDay()
            let bitMask: number

            switch (weekday) {
              case 0:
                bitMask = 0x0000001
                break
              case 1:
                bitMask = 0x0000010
                break
              case 2:
                bitMask = 0x0000100
                break
              case 3:
                bitMask = 0x0001000
                break
              case 4:
                bitMask = 0x0010000
                break
              case 5:
                bitMask = 0x0100000
                break
              case 6:
                bitMask = 0x1000000
                break
              default:
                bitMask = 0x0000000
                break
            }

            if ((bitMask & input.repeat) === 0) {
              continue
            }

            result = pipe(
              result,
              taskEither.chain(() =>
                insertTask({
                  name: formatTaskName(input.name, start_time, i),
                  description: option.none,
                  project: input.project,
                  expectedWorkingHours: input.expectedWorkingHours,
                  hourlyCost: input.hourlyCost,
                  start_time
                })
              )
            )
          }

          return result
        })
      )
    ),
    taskEither.chain(() => getProjectById(input.project)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`Unable to retrieve the project after the creation of the tasks batch`
        )
      )
    )
  )
}

const taskNamePattern = /^\s*#\s*$|^D{1,4}$|^M{1,4}$|^Y{1,4}$/

function formatTaskName(
  name: NonEmptyString,
  date: Date,
  index: number
): NonEmptyString {
  let didMatch = false

  function match(matchFunction: (s: string) => string): (s: string) => string {
    return s => {
      didMatch = true
      return matchFunction(s)
    }
  }

  const matches = {
    '#': () => (index + 1).toString(10),
    DDDD: () => date.toLocaleDateString(undefined, { weekday: 'long' }),
    DDD: () => date.toLocaleDateString(undefined, { weekday: 'short' }),
    DD: () => {
      const n = date.getDate()
      return (n < 10 ? '0' : '') + n
    },
    D: () => date.getDate().toString(10),
    MMMM: () => date.toLocaleString(undefined, { month: 'long' }),
    MMM: () => date.toLocaleString(undefined, { month: 'short' }),
    MM: () => {
      const n = date.getMonth() + 1
      return (n < 10 ? '0' : '') + n
    },
    M: () => (date.getMonth() + 1).toString(10),
    YYYY: () => date.getFullYear().toString(10),
    YY: () => date.getFullYear().toString(10).substring(2)
  }

  return name
    .split(/\b/)
    .map(s => {
      if (!taskNamePattern.test(s)) {
        return s
      }

      didMatch = false
      const entries = Object.entries(matches)

      for (let [target, replacement] of entries) {
        s = s.replace(target, match(replacement))

        if (didMatch) {
          return s
        }
      }

      return s
    })
    .join('') as NonEmptyString
}

export function getTask(
  id: PositiveInteger,
  user: User
): TaskEither<CoolerError, Task> {
  return pipe(
    getTaskById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The task you are looking for was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        task => task.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot see this task`)
      )
    )
  )
}

export function listTasks(
  args: TasksConnectionQueryArgs,
  user: User
): TaskEither<CoolerError, Connection<Task>> {
  const sql = SQL`
    JOIN project ON project.id = task.project
    JOIN client ON client.id = project.client
    WHERE user = ${user.id}
  `

  pipe(
    args.name,
    option.fold(constVoid, name =>
      sql.append(SQL` AND project.name LIKE ${`%${name}%`}`)
    )
  )

  return queryToConnection(args, ['task.*, client.user'], 'task', Task, sql)
}

export function updateTask(
  id: PositiveInteger,
  input: TaskUpdateInput,
  user: User
): TaskEither<CoolerError, Task> {
  return pipe(
    getTaskById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The task you want to update was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        task => task.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot update this task`)
      )
    ),
    taskEither.chain(() =>
      pipe(
        input.project,
        option.fromNullable,
        option.fold(
          () => taskEither.right(void 0),
          flow(
            getProjectById,
            taskEither.chain(
              taskEither.fromOption(() =>
                coolerError('COOLER_404', a18n`The new project was not found`)
              )
            ),
            taskEither.chain(
              taskEither.fromPredicate(
                project => project.user === user.id,
                () =>
                  coolerError(
                    'COOLER_403',
                    a18n`You cannot assign this project to a task`
                  )
              )
            ),
            taskEither.map(constVoid)
          )
        )
      )
    ),
    taskEither.chain(() => updateDatabaseTask(id, input)),
    taskEither.chain(() => getTaskById(id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_500',
          a18n`Unable to retrieve the task after update`
        )
      )
    )
  )
}

export function deleteTask(
  id: PositiveInteger,
  user: User
): TaskEither<CoolerError, Task> {
  return pipe(
    getTaskById(id),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError(
          'COOLER_404',
          a18n`The task you want to delete was not found`
        )
      )
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        task => task.user === user.id,
        () => coolerError('COOLER_403', a18n`You cannot delete this task`)
      )
    ),
    taskEither.chain(task =>
      pipe(
        deleteDatabasetask(task.id),
        taskEither.map(() => task)
      )
    )
  )
}

export function getTaskProject(
  task: DatabaseTask
): TaskEither<CoolerError, Project> {
  return pipe(
    getProjectById(task.project),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_404', a18n`The project of this task was not found`)
      )
    )
  )
}

export function getUserTasks(
  user: DatabaseUser,
  args: UserTasksConnectionQueryArgs
): TaskEither<CoolerError, Connection<Task>> {
  const rest = SQL`
    JOIN project ON project.id = task.project
    JOIN client ON project.client = client.id
    WHERE client.user = ${user.id}
  `

  pipe(
    args.from,
    option.fold(
      constVoid,
      flow(DateFromSQLDate.encode, from =>
        rest.append(SQL` AND start_time >= ${from}`)
      )
    )
  )

  pipe(
    args.to,
    option.fold(
      constVoid,
      flow(DateFromSQLDate.encode, to =>
        rest.append(SQL` AND start_time <= ${to}`)
      )
    )
  )

  return queryToConnection(
    args,
    ['task.*, client.user'],
    'task',
    DatabaseTask,
    rest
  )
}

export function getProjectTasks(
  project: DatabaseProject,
  args: ConnectionQueryArgs
): TaskEither<CoolerError, Connection<Task>> {
  return queryToConnection(
    args,
    ['*'],
    'task',
    DatabaseTask,
    SQL`WHERE project = ${project.id}`
  )
}
