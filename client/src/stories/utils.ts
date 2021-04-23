import { option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { unsafeLocalizedString } from '../a18n'
import { Project } from '../entities/Project'
import { Task } from '../entities/Task'
import { Tax } from '../entities/Tax'
import {
  LocalizedString,
  PositiveInteger,
  unsafeNonNegativeNumber,
  unsafePercentage,
  unsafePositiveInteger
} from '../globalDomain'

interface FakeClient {
  id: PositiveInteger
  name: LocalizedString
}

export const fakeClients: FakeClient[] = [
  {
    id: unsafePositiveInteger(1),
    name: unsafeLocalizedString('John Doe')
  },
  {
    id: unsafePositiveInteger(2),
    name: unsafeLocalizedString('Some Company')
  }
]

export const findClients = (
  input: string
): TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>> => {
  const regex = new RegExp(input, 'i')

  return pipe(
    fakeClients
      .filter(({ name }) => regex.test(name))
      .reduce<Record<PositiveInteger, LocalizedString>>(
        (res, { id, name }) => ({ ...res, [id]: name }),
        {}
      ),
    options => task.fromIO(() => options),
    task.delay(500),
    taskEither.rightTask
  )
}

interface FakeProject {
  id: PositiveInteger
  name: LocalizedString
}

export const fakeProjects: FakeProject[] = [
  {
    id: unsafePositiveInteger(1),
    name: unsafeLocalizedString('Some Project')
  },
  {
    id: unsafePositiveInteger(2),
    name: unsafeLocalizedString('Another Project')
  }
]

export const findProjects = (
  input: string
): TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>> => {
  const regex = new RegExp(input, 'i')

  return pipe(
    fakeProjects
      .filter(({ name }) => regex.test(name))
      .reduce<Record<PositiveInteger, LocalizedString>>(
        (res, { id, name }) => ({ ...res, [id]: name }),
        {}
      ),
    options => task.fromIO(() => options),
    task.delay(500),
    taskEither.rightTask
  )
}

export const fakeProject: Project = {
  id: unsafePositiveInteger(42),
  name: unsafeLocalizedString('Some Project'),
  description: option.some(
    unsafeLocalizedString(
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto ad consequatur provident praesentium quasi vel nostrum. Rem non molestiae animi fugiat, voluptas rerum quia facilis.'
    )
  ),
  client: fakeClients[0],
  cashed: option.some({
    at: new Date(2021, 0, 1, 15, 30),
    balance: unsafeNonNegativeNumber(1500)
  }),
  created_at: new Date(2020, 8, 20, 9, 30),
  updated_at: new Date(2021, 0, 1, 15, 45),
  expectedWorkingHours: unsafeNonNegativeNumber(100),
  actualWorkingHours: unsafeNonNegativeNumber(98),
  budget: unsafeNonNegativeNumber(1500),
  balance: unsafeNonNegativeNumber(1470)
}

interface FakeTask {
  id: PositiveInteger
  name: LocalizedString
}

export const fakeTasks: FakeTask[] = [
  {
    id: unsafePositiveInteger(1),
    name: unsafeLocalizedString('Some Task')
  },
  {
    id: unsafePositiveInteger(2),
    name: unsafeLocalizedString('Another Task')
  }
]

export const findTasks = (
  input: string
): TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>> => {
  const regex = new RegExp(input, 'i')

  return pipe(
    fakeTasks
      .filter(({ name }) => regex.test(name))
      .reduce<Record<PositiveInteger, LocalizedString>>(
        (res, { id, name }) => ({ ...res, [id]: name }),
        {}
      ),
    options => task.fromIO(() => options),
    task.delay(500),
    taskEither.rightTask
  )
}

export const fakeTask: Task = {
  id: unsafePositiveInteger(2),
  name: unsafeLocalizedString('Some Task'),
  description: option.some(
    unsafeLocalizedString(
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto ad consequatur provident praesentium quasi vel nostrum. Rem non molestiae animi fugiat, voluptas rerum quia facilis.'
    )
  ),
  expectedWorkingHours: unsafeNonNegativeNumber(8),
  actualWorkingHours: unsafeNonNegativeNumber(6),
  hourlyCost: unsafeNonNegativeNumber(15),
  start_time: new Date(2020, 8, 20, 9, 30),
  project: fakeProjects[0],
  created_at: new Date(2020, 8, 20, 9, 30),
  updated_at: new Date(2021, 0, 1, 15, 45)
}

export const fakeTaxes: Tax[] = [
  {
    id: unsafePositiveInteger(1),
    label: unsafeLocalizedString('Some tax'),
    value: unsafePercentage(0.2572)
  },
  {
    id: unsafePositiveInteger(2),
    label: unsafeLocalizedString('Some other tax'),
    value: unsafePercentage(0.1005)
  }
]
