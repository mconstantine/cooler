import gql from 'graphql-tag'
import * as t from 'io-ts'
import {
  DateFromISOString,
  NonEmptyString,
  optionFromNullable
} from 'io-ts-types'
import { TaxCreationInput, TaxUpdateInput } from '../../../../entities/Tax'
import {
  EmailString,
  LocalizedString,
  NonNegativeNumber,
  Percentage,
  PositiveInteger
} from '../../../../globalDomain'
import { Connection, makeMutation, makeQuery } from '../../../../misc/graphql'

const Tax = t.type({
  id: PositiveInteger,
  label: LocalizedString,
  value: Percentage
})

const ProfileQueryInput = t.type(
  {
    since: DateFromISOString
  },
  'ProfileQueryInput'
)
export type ProfileQueryInput = t.TypeOf<typeof ProfileQueryInput>

const ProfileQueryOutput = t.type(
  {
    me: t.type({
      id: PositiveInteger,
      name: LocalizedString,
      email: EmailString,
      created_at: DateFromISOString,
      updated_at: DateFromISOString,
      expectedWorkingHours: NonNegativeNumber,
      actualWorkingHours: NonNegativeNumber,
      budget: NonNegativeNumber,
      balance: NonNegativeNumber,
      cashedBalance: NonNegativeNumber,
      taxes: Connection(Tax)
    })
  },
  'ProfileQueryOutput'
)
export type ProfileQueryOutput = t.TypeOf<typeof ProfileQueryOutput>

export const profileQuery = makeQuery({
  query: gql`
    query me($since: Date!) {
      me {
        id
        name
        email
        created_at
        updated_at
        expectedWorkingHours(since: $since)
        actualWorkingHours(since: $since)
        budget(since: $since)
        balance(since: $since)
        cashedBalance(since: $since)
        taxes {
          pageInfo {
            startCursor
            endCursor
            hasNextPage
            hasPreviousPage
          }
          totalCount
          edges {
            cursor
            node {
              id
              label
              value
            }
          }
        }
      }
    }
  `,
  inputCodec: ProfileQueryInput,
  outputCodec: ProfileQueryOutput
})

const UserUpdateInput = t.type(
  {
    name: LocalizedString,
    email: EmailString,
    password: optionFromNullable(NonEmptyString)
  },
  'UserUpdate'
)

const UpdateProfileMutationInput = t.type(
  {
    user: UserUpdateInput
  },
  'UpdateProfileInput'
)

const UpdateProfileMutationOutput = t.type(
  {
    updateMe: t.type({
      id: PositiveInteger,
      name: LocalizedString,
      email: EmailString,
      updated_at: DateFromISOString
    })
  },
  'UpdateProfileOutput'
)

export const updateProfileMutation = makeMutation({
  query: gql`
    mutation updateProfile($user: UserUpdateInput!) {
      updateMe(user: $user) {
        id
        name
        email
        updated_at
      }
    }
  `,
  inputCodec: UpdateProfileMutationInput,
  outputCodec: UpdateProfileMutationOutput
})

export const deleteProfileMutation = makeMutation({
  query: gql`
    mutation deleteMe {
      deleteMe {
        id
      }
    }
  `,
  inputCodec: t.void,
  outputCodec: t.unknown
})

const CreateTaxInput = t.type(
  {
    tax: TaxCreationInput
  },
  'CreateTaxInput'
)

const CreateTaxOutput = t.type(
  {
    createTax: Tax
  },
  'CreateTaxOutput'
)

export const createTaxMutation = makeMutation({
  query: gql`
    mutation createTax($tax: TaxCreationInput!) {
      createTax(tax: $tax) {
        id
        label
        value
      }
    }
  `,
  inputCodec: CreateTaxInput,
  outputCodec: CreateTaxOutput
})

const UpdateTaxInput = t.type(
  {
    id: PositiveInteger,
    tax: TaxUpdateInput
  },
  'UpdateTaxInput'
)

const UpdateTaxOutput = t.type(
  {
    updateTax: Tax
  },
  'UpdateTaxOutput'
)

export const updateTaxMutation = makeMutation({
  query: gql`
    mutation updateTax($id: Int!, $tax: TaxUpdateInput!) {
      updateTax(id: $id, tax: $tax) {
        id
        label
        value
      }
    }
  `,
  inputCodec: UpdateTaxInput,
  outputCodec: UpdateTaxOutput
})

const DeleteTaxInput = t.type(
  {
    id: PositiveInteger
  },
  'DeleteTaxInput'
)

const DeleteTaxOutput = t.type(
  {
    deleteTax: Tax
  },
  'DeleteTaxOutput'
)

export const deleteTaxMutation = makeMutation({
  query: gql`
    mutation deleteTax($id: Int!) {
      deleteTax(id: $id) {
        id
        label
        value
      }
    }
  `,
  inputCodec: DeleteTaxInput,
  outputCodec: DeleteTaxOutput
})
