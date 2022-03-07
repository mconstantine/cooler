import faker from 'faker'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import {
  NonNegativeNumber,
  PositiveInteger,
  unsafeNonEmptyString
} from '../misc/Types'
import { TaskCreationInput } from '../task/interface'

export function getFakeTask(
  project: PositiveInteger,
  data: Partial<TaskCreationInput> = {}
): TaskCreationInput {
  return {
    name: unsafeNonEmptyString(faker.lorem.sentence()),
    description: pipe(
      Math.random() < 0.5,
      boolean.fold(
        () => option.none,
        () => option.some(unsafeNonEmptyString(faker.lorem.paragraph()))
      )
    ),
    expectedWorkingHours: (1 + faker.random.number(99)) as NonNegativeNumber,
    hourlyCost: (10 +
      Math.floor(Math.random() * 10 * 2) / 2) as NonNegativeNumber,
    start_time: pipe(
      Math.random() < 0.5,
      boolean.fold(
        () => faker.date.future(1),
        () => faker.date.future(-1)
      )
    ),
    project,
    ...data
  }
}
