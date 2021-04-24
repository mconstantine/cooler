import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import * as t from 'io-ts'
import {
  DateFromISOString,
  option as optionCodec,
  optionFromNullable
} from 'io-ts-types'
import {
  LocalizedString,
  NonNegativeNumber,
  PositiveInteger
} from '../globalDomain'
import { Connection } from '../misc/graphql'
import { Tax } from './Tax'

const CashData = t.type({
  at: DateFromISOString,
  balance: NonNegativeNumber
})
export type CashData = t.TypeOf<typeof CashData>

const User = t.type(
  {
    taxes: Connection(Tax)
  },
  'User'
)

const Client = t.type(
  {
    id: PositiveInteger,
    name: LocalizedString,
    user: User
  },
  'Client'
)

const ProjectInput = t.type(
  {
    id: PositiveInteger,
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    client: Client,
    cashed_at: optionFromNullable(DateFromISOString),
    cashed_balance: optionFromNullable(NonNegativeNumber),
    created_at: DateFromISOString,
    updated_at: DateFromISOString,
    expectedWorkingHours: NonNegativeNumber,
    actualWorkingHours: NonNegativeNumber,
    budget: NonNegativeNumber,
    balance: NonNegativeNumber
  },
  'ProjectInput'
)
type ProjectInput = t.TypeOf<typeof ProjectInput>

export const Project = t.type(
  {
    id: PositiveInteger,
    name: LocalizedString,
    description: optionFromNullable(LocalizedString),
    client: Client,
    cashed: optionCodec(CashData),
    created_at: DateFromISOString,
    updated_at: DateFromISOString,
    expectedWorkingHours: NonNegativeNumber,
    actualWorkingHours: NonNegativeNumber,
    budget: NonNegativeNumber,
    balance: NonNegativeNumber
  },
  'Project'
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
    name: LocalizedString,
    description: optionCodec(LocalizedString),
    client: PositiveInteger,
    cashed: optionCodec(CashData)
  },
  'ProjectCreationInput'
)
export type ProjectCreationInput = t.TypeOf<typeof ProjectCreationInput>

const ProjectCreationOutput = t.type(
  {
    name: LocalizedString,
    description: t.union([LocalizedString, t.null]),
    client: PositiveInteger,
    cashed_at: t.union([DateFromISOString, t.null]),
    cashed_balance: t.union([NonNegativeNumber, t.null])
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
          description: option.fromNullable(output.description),
          cashed: pipe(
            sequenceS(option.option)({
              at: option.fromNullable(output.cashed_at),
              balance: option.fromNullable(output.cashed_balance)
            })
          )
        })
      )
    ),
  input => ({
    ...input,
    description: option.toNullable(input.description),
    cashed_at: pipe(
      input.cashed,
      option.map(({ at }) => at),
      option.toNullable
    ),
    cashed_balance: pipe(
      input.cashed,
      option.map(({ balance }) => balance),
      option.toNullable
    ),
    cashed: undefined
  })
)
