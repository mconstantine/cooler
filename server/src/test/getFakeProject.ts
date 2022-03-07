import faker from 'faker'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import {
  NonNegativeNumber,
  PositiveInteger,
  unsafeNonEmptyString
} from '../misc/Types'
import { ProjectCreationInput } from '../project/interface'

export function getFakeProject(
  client: PositiveInteger,
  data: Partial<ProjectCreationInput> = {}
): ProjectCreationInput {
  const cashed = pipe(
    Math.random() < 0.5,
    boolean.fold(
      () => option.none,
      () =>
        option.some({
          at: (() => {
            const date = faker.date.past(1)
            date.setMilliseconds(0)
            return date
          })(),
          balance: 1 as NonNegativeNumber
        })
    )
  )

  return {
    name: unsafeNonEmptyString(faker.commerce.productName()),
    description: pipe(
      Math.random() < 0.5,
      boolean.fold(
        () => option.none,
        () => option.some(unsafeNonEmptyString(faker.lorem.sentence()))
      )
    ),
    cashed,
    client,
    ...data
  }
}
