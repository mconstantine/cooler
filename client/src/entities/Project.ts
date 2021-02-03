import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  option as optionCodec,
  optionFromNullable
} from 'io-ts-types'
import { NonNegativeNumber, PositiveInteger } from '../globalDomain'

const CashData = t.type({
  at: DateFromISOString,
  balance: NonNegativeNumber
})
type CashData = t.TypeOf<typeof CashData>

const ProjectInput = t.type(
  {
    id: PositiveInteger,
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    client: PositiveInteger,
    cashed_at: optionFromNullable(DateFromISOString),
    cashed_balance: optionFromNullable(NonNegativeNumber),
    created_at: DateFromISOString,
    updated_at: DateFromISOString
  },
  'ProjectFromAPI'
)
type ProjectInput = t.TypeOf<typeof ProjectInput>

export const Project = t.type(
  {
    id: PositiveInteger,
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    client: PositiveInteger,
    cashed: optionCodec(CashData),
    created_at: DateFromISOString,
    updated_at: DateFromISOString
  },
  'ProjectFromAPI'
)
export type Project = t.TypeOf<typeof Project>

export const ProjectFromAPI: t.Type<
  Project,
  ProjectInput,
  unknown
> = new t.Type(
  'ProjectFromAPI',
  Project.is,
  (u, c) =>
    pipe(
      ProjectInput.validate(u, c),
      either.chain(input =>
        t.success({
          ...input,
          cashed: pipe(
            sequenceS(option.option)({
              cashed_at: input.cashed_at,
              cashed_balance: input.cashed_balance
            }),
            option.map(({ cashed_at, cashed_balance }) => ({
              at: cashed_at,
              balance: cashed_balance
            }))
          )
        })
      )
    ),
  project => ({
    ...project,
    cashed_at: pipe(
      project.cashed,
      option.map(cashed => cashed.at)
    ),
    cashed_balance: pipe(
      project.cashed,
      option.map(cashed => cashed.balance)
    )
  })
)

export const ProjectCreationInput = t.type(
  {
    name: NonEmptyString,
    description: optionCodec(NonEmptyString),
    client: PositiveInteger,
    cashed: optionCodec(CashData)
  },
  'ProjectCreationInput'
)
export type ProjectCreationInput = t.TypeOf<typeof ProjectCreationInput>

const ProjectCreationOutput = t.type(
  {
    name: NonEmptyString,
    description: optionCodec(NonEmptyString),
    client: PositiveInteger,
    cashed_at: optionFromNullable(DateFromISOString),
    cashed_balance: optionFromNullable(NonNegativeNumber)
  },
  'ProjectCreationOutput'
)
type ProjectCreationOutput = t.TypeOf<typeof ProjectCreationOutput>

export const ProjectCreationInputFromAPI: t.Type<
  ProjectCreationInput,
  ProjectCreationOutput,
  unknown
> = new t.Type(
  'ProjectCreationInputFromAPI',
  ProjectCreationInput.is,
  (u, c) =>
    pipe(
      ProjectCreationOutput.validate(u, c),
      either.chain(output =>
        t.success({
          ...output,
          cashed: pipe(
            sequenceS(option.option)({
              at: output.cashed_at,
              balance: output.cashed_balance
            })
          )
        })
      )
    ),
  input => ({
    ...input,
    cashed_at: pipe(
      input.cashed,
      option.map(({ at }) => at)
    ),
    cashed_balance: pipe(
      input.cashed,
      option.map(({ balance }) => balance)
    )
  })
)
