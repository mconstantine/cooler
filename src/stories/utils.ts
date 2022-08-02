import { option, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { unsafeLocalizedString } from '../a18n'
import { ClientType, ProjectWithStats } from '../entities/Project'
import { TaskWithStats } from '../entities/Task'
import { Tax } from '../entities/Tax'
import {
  LocalizedString,
  ObjectId,
  PositiveInteger,
  unsafeNonNegativeNumber,
  unsafeObjectId,
  unsafePercentage
} from '../globalDomain'
import ObjectID from 'bson-objectid'

export const fakeTaxes: Tax[] = [
  {
    _id: unsafeObjectId(ObjectID()),
    label: unsafeLocalizedString('Some tax'),
    value: unsafePercentage(0.2572)
  },
  {
    _id: unsafeObjectId(ObjectID()),
    label: unsafeLocalizedString('Some other tax'),
    value: unsafePercentage(0.1005)
  }
]

interface FakeClient {
  _id: ObjectId
  type: ClientType
  name: LocalizedString
  user: ObjectId
}

export const fakeClients: FakeClient[] = [
  {
    _id: unsafeObjectId(ObjectID()),
    type: 'PRIVATE',
    name: unsafeLocalizedString('John Doe'),
    user: unsafeObjectId(ObjectID())
  },
  {
    _id: unsafeObjectId(ObjectID()),
    type: 'BUSINESS',
    name: unsafeLocalizedString('Some Company'),
    user: unsafeObjectId(ObjectID())
  }
]

export const findClients = (
  input: string
): TaskEither<LocalizedString, Record<PositiveInteger, LocalizedString>> => {
  const regex = new RegExp(input, 'i')

  return pipe(
    fakeClients
      .filter(({ name }) => regex.test(name))
      .reduce<Record<ObjectId, LocalizedString>>(
        (res, { _id, name }) => ({ ...res, [_id]: name }),
        {}
      ),
    options => task.fromIO(() => options),
    task.delay(500),
    taskEither.rightTask
  )
}

interface FakeProject {
  _id: ObjectId
  name: LocalizedString
}

export const fakeProjects: FakeProject[] = [
  {
    _id: unsafeObjectId(ObjectID()),
    name: unsafeLocalizedString('Some Project')
  },
  {
    _id: unsafeObjectId(ObjectID()),
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
      .reduce<Record<ObjectId, LocalizedString>>(
        (res, { _id, name }) => ({ ...res, [_id]: name }),
        {}
      ),
    options => task.fromIO(() => options),
    task.delay(500),
    taskEither.rightTask
  )
}

export const fakeProject: ProjectWithStats = {
  _id: unsafeObjectId(ObjectID()),
  name: unsafeLocalizedString('Some Project'),
  description: option.some(
    unsafeLocalizedString(
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto ad consequatur provident praesentium quasi vel nostrum. Rem non molestiae animi fugiat, voluptas rerum quia facilis.'
    )
  ),
  client: fakeClients[0],
  cashData: option.some({
    at: new Date(2021, 0, 1, 15, 30),
    amount: unsafeNonNegativeNumber(1500)
  }),
  createdAt: new Date(2020, 8, 20, 9, 30),
  updatedAt: new Date(2021, 0, 1, 15, 45),
  expectedWorkingHours: unsafeNonNegativeNumber(100),
  actualWorkingHours: unsafeNonNegativeNumber(98),
  budget: unsafeNonNegativeNumber(1500),
  balance: unsafeNonNegativeNumber(1470)
}

interface FakeTask {
  _id: ObjectId
  name: LocalizedString
}

export const fakeTasks: FakeTask[] = [
  {
    _id: unsafeObjectId(ObjectID()),
    name: unsafeLocalizedString('Some Task')
  },
  {
    _id: unsafeObjectId(ObjectID()),
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
        (res, { _id, name }) => ({ ...res, [_id]: name }),
        {}
      ),
    options => task.fromIO(() => options),
    task.delay(500),
    taskEither.rightTask
  )
}

export const fakeTask: TaskWithStats = {
  _id: unsafeObjectId(ObjectID()),
  name: unsafeLocalizedString('Some Task'),
  description: option.some(
    unsafeLocalizedString(
      'Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto ad consequatur provident praesentium quasi vel nostrum. Rem non molestiae animi fugiat, voluptas rerum quia facilis.'
    )
  ),
  expectedWorkingHours: unsafeNonNegativeNumber(8),
  actualWorkingHours: unsafeNonNegativeNumber(6),
  hourlyCost: unsafeNonNegativeNumber(15),
  startTime: new Date(2020, 8, 20, 9, 30),
  project: fakeProjects[0],
  client: fakeClients[0],
  createdAt: new Date(2020, 8, 20, 9, 30),
  updatedAt: new Date(2021, 0, 1, 15, 45)
}
