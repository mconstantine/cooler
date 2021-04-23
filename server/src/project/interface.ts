import { boolean, either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { sequenceS } from 'fp-ts/Apply'
import { Option } from 'fp-ts/Option'
import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  option as tOption,
  optionFromNullable
} from 'io-ts-types'
import {
  DateFromSQLDate,
  NonNegativeNumber,
  PositiveInteger
} from '../misc/Types'
import { reportDecodeErrors } from '../misc/reportDecodeErrors'

const CashData = t.type({
  at: DateFromISOString,
  balance: NonNegativeNumber
})
type CashData = t.TypeOf<typeof CashData>

const DatabaseCashData = t.type({
  at: DateFromSQLDate,
  balance: NonNegativeNumber
})
type DatabaseCashData = t.TypeOf<typeof DatabaseCashData>

export const PlainProject = t.type(
  {
    id: t.number,
    name: t.string,
    description: t.union([t.string, t.null]),
    client: t.number,
    cashed_at: t.union([t.string, t.null]),
    cashed_balance: t.union([t.number, t.null]),
    created_at: t.string,
    updated_at: t.string
  },
  'PlainProject'
)
export type PlainProject = t.TypeOf<typeof PlainProject>

const ProjectMiddleware = t.type(
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
  'ProjectMiddleware'
)
type ProjectMiddleware = t.TypeOf<typeof ProjectMiddleware>

const DatabaseProjectMiddleware = t.type(
  {
    id: PositiveInteger,
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    client: PositiveInteger,
    user: PositiveInteger,
    cashed_at: optionFromNullable(DateFromISOString),
    cashed_balance: optionFromNullable(NonNegativeNumber),
    created_at: DateFromSQLDate,
    updated_at: DateFromSQLDate
  },
  'DatabaseProjectMiddleware'
)
type DatabaseProjectMiddleware = t.TypeOf<typeof ProjectMiddleware>

interface ProjectC {
  id: PositiveInteger
  name: NonEmptyString
  description: Option<NonEmptyString>
  client: PositiveInteger
  cashed: Option<CashData>
  created_at: Date
  updated_at: Date
}

interface DatabaseProjectC {
  id: PositiveInteger
  name: NonEmptyString
  description: Option<NonEmptyString>
  client: PositiveInteger
  user: PositiveInteger
  cashed: Option<CashData>
  created_at: Date
  updated_at: Date
}

const Projectish = t.type(
  {
    id: PositiveInteger,
    name: NonEmptyString,
    description: tOption(NonEmptyString),
    client: PositiveInteger,
    created_at: t.unknown,
    updated_at: t.unknown,
    cashed: t.unknown
  },
  'Projectish'
)

const DatabaseProjectish = t.type(
  {
    id: PositiveInteger,
    name: NonEmptyString,
    description: tOption(NonEmptyString),
    client: PositiveInteger,
    user: PositiveInteger,
    created_at: t.unknown,
    updated_at: t.unknown,
    cashed: t.unknown
  },
  'Projectish'
)

export const Project = new t.Type<ProjectC, PlainProject>(
  'Project',
  (u): u is ProjectC =>
    Projectish.is(u) &&
    tOption(CashData).is(u.cashed) &&
    DateFromISOString.is(u.created_at) &&
    DateFromISOString.is(u.updated_at),
  (u, c) =>
    pipe(
      ProjectMiddleware.validate(u, c),
      either.chain(u =>
        pipe(
          sequenceS(option.option)({
            at: u.cashed_at,
            balance: u.cashed_balance
          }),
          option.fold(
            () =>
              t.success({
                id: u.id,
                name: u.name,
                description: u.description,
                client: u.client,
                cashed: option.none,
                created_at: u.created_at,
                updated_at: u.updated_at
              }),
            cashed =>
              t.success({
                id: u.id,
                name: u.name,
                description: u.description,
                client: u.client,
                cashed: option.some(cashed),
                created_at: u.created_at,
                updated_at: u.updated_at
              })
          )
        )
      )
    ),
  project =>
    pipe(
      {
        id: project.id,
        name: project.name,
        description: project.description,
        client: project.client,
        cashed_at: pipe(
          project.cashed,
          option.map(({ at }) => at)
        ),
        cashed_balance: pipe(
          project.cashed,
          option.map(({ balance }) => balance)
        ),
        created_at: project.created_at,
        updated_at: project.updated_at
      },
      ProjectMiddleware.encode
    )
)
export type Project = t.TypeOf<typeof Project>

export const DatabaseProject = new t.Type<DatabaseProjectC, PlainProject>(
  'DatabaseProject',
  (u): u is DatabaseProjectC =>
    DatabaseProjectish.is(u) &&
    tOption(CashData).is(u.cashed) &&
    DateFromSQLDate.is(u.created_at) &&
    DateFromSQLDate.is(u.updated_at),
  (u, c) => {
    return pipe(
      DatabaseProjectMiddleware.validate(u, c),
      reportDecodeErrors('DatabaseProjectMiddleware'),
      either.chain(u =>
        pipe(
          sequenceS(option.option)({
            at: u.cashed_at,
            balance: u.cashed_balance
          }),
          option.fold(
            () =>
              t.success({
                id: u.id,
                name: u.name,
                description: u.description,
                client: u.client,
                user: u.user,
                cashed: option.none,
                created_at: u.created_at,
                updated_at: u.updated_at
              }),
            cashed =>
              t.success({
                id: u.id,
                name: u.name,
                description: u.description,
                client: u.client,
                user: u.user,
                cashed: option.some(cashed),
                created_at: u.created_at,
                updated_at: u.updated_at
              })
          )
        )
      )
    )
  },
  project =>
    pipe(
      {
        id: project.id,
        name: project.name,
        description: project.description,
        client: project.client,
        user: project.user,
        cashed_at: pipe(
          project.cashed,
          option.map(({ at }) => at)
        ),
        cashed_balance: pipe(
          project.cashed,
          option.map(({ balance }) => balance)
        ),
        created_at: project.created_at,
        updated_at: project.updated_at
      },
      DatabaseProjectMiddleware.encode
    )
)
export type DatabaseProject = t.TypeOf<typeof DatabaseProject>

interface ProjectCreationInputC {
  name: NonEmptyString
  description: Option<NonEmptyString>
  client: PositiveInteger
  cashed: Option<DatabaseCashData>
}

interface PlainProjectCreationInput {
  name: string
  description: string | null
  client: number
  cashed_at: string | null
  cashed_balance: number | null
}

const ProjectCreationInputMiddleware = t.type(
  {
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    client: PositiveInteger,
    cashed_at: optionFromNullable(DateFromSQLDate),
    cashed_balance: optionFromNullable(NonNegativeNumber)
  },
  'ProjectCreationInputMiddleware'
)
type ProjectCreationInputMiddleware = t.TypeOf<
  typeof ProjectCreationInputMiddleware
>

const ProjectCreationInputish = t.type(
  {
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    client: PositiveInteger,
    cashed: t.UnknownRecord
  },
  'ProjectCreationInputish'
)

export const ProjectCreationInput = new t.Type<
  ProjectCreationInputC,
  PlainProjectCreationInput
>(
  'ProjectCreationInput',
  (u): u is ProjectC =>
    ProjectCreationInputish.is(u) && tOption(CashData).is(u.cashed),
  (u, c) =>
    pipe(
      ProjectCreationInputMiddleware.validate(u, c),
      either.chain(u =>
        pipe(
          sequenceS(option.option)({
            at: u.cashed_at,
            balance: u.cashed_balance
          }),
          option.fold(
            () =>
              t.success({
                name: u.name,
                description: u.description,
                client: u.client,
                cashed: option.none
              }),
            cashed =>
              t.success({
                name: u.name,
                description: u.description,
                client: u.client,
                cashed: option.some(cashed)
              })
          )
        )
      )
    ),
  project =>
    pipe(
      {
        name: project.name,
        description: project.description,
        client: project.client,
        cashed_at: pipe(
          project.cashed,
          option.map(({ at }) => at)
        ),
        cashed_balance: pipe(
          project.cashed,
          option.map(({ balance }) => balance)
        )
      },
      ProjectCreationInputMiddleware.encode
    )
)
export type ProjectCreationInput = t.TypeOf<typeof ProjectCreationInput>

interface ProjectUpdateInputC {
  name?: NonEmptyString
  description?: Option<NonEmptyString>
  client?: PositiveInteger
  cashed?: Option<DatabaseCashData>
}

interface PlainProjectUpdateInput {
  name?: string
  description?: string | null
  client?: number
  cashed_at?: string | null
  cashed_balance?: number | null
}

const ProjectUpdateInputMiddleware = t.partial(
  {
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    client: PositiveInteger,
    cashed_at: optionFromNullable(DateFromSQLDate),
    cashed_balance: optionFromNullable(NonNegativeNumber)
  },
  'ProjectUpdateInputMiddleware'
)
type ProjectUpdateInputMiddleware = t.TypeOf<
  typeof ProjectUpdateInputMiddleware
>

const ProjectUpdateInputish = t.partial(
  {
    name: NonEmptyString,
    description: optionFromNullable(NonEmptyString),
    client: PositiveInteger,
    cashed: t.UnknownRecord
  },
  'ProjectUpdateInputish'
)

export const ProjectUpdateInput = new t.Type<
  ProjectUpdateInputC,
  PlainProjectUpdateInput
>(
  'ProjectUpdateInput',
  (u): u is ProjectC =>
    ProjectUpdateInputish.is(u) && tOption(DatabaseCashData).is(u.cashed),
  (u, c) =>
    pipe(
      ProjectUpdateInputMiddleware.validate(u, c),
      either.chain(u =>
        pipe(
          u.cashed_at === undefined && u.cashed_balance === undefined,
          boolean.fold(
            () =>
              pipe(
                sequenceS(option.option)({
                  at: u.cashed_at!,
                  balance: u.cashed_balance!
                }),
                option.fold(
                  () =>
                    t.success({
                      name: u.name,
                      description: u.description,
                      client: u.client,
                      cashed: option.none
                    }),
                  cashed =>
                    t.success({
                      name: u.name,
                      description: u.description,
                      client: u.client,
                      cashed: option.some(cashed)
                    })
                )
              ),
            () =>
              t.success({
                name: u.name,
                description: u.description,
                client: u.client
              })
          )
        )
      )
    ),
  project =>
    pipe(
      {
        name: project.name,
        description: project.description,
        client: project.client,
        ...pipe(
          project.cashed === undefined,
          boolean.fold(
            () => ({
              cashed_at: pipe(
                project.cashed!,
                option.map(({ at }) => at)
              ),
              cashed_balance: pipe(
                project.cashed!,
                option.map(({ balance }) => balance)
              )
            }),
            () => ({})
          )
        )
      },
      ProjectUpdateInputMiddleware.encode
    )
)
export type ProjectUpdateInput = t.TypeOf<typeof ProjectUpdateInput>
