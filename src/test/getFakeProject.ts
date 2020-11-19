import faker from 'faker'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { NonNegativeNumber, PositiveInteger } from '../misc/Types'
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
          at: faker.date.past(1),
          balance: 1 as NonNegativeNumber
        })
    )
  )

  return {
    name: faker.commerce.productName() as NonEmptyString,
    description: pipe(
      Math.random() < 0.5,
      boolean.fold(
        () => option.none,
        () => option.some(faker.lorem.sentence() as NonEmptyString)
      )
    ),
    cashed,
    client,
    ...data
  }
}
