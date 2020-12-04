import { Tax, TaxCreationInput, TaxUpdateInput } from './interface'
import { DatabaseUser, User } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import {
  createTax,
  updateTax,
  deleteTax,
  getTax,
  listTaxes,
  getTaxUser,
  getUserTaxes
} from './model'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'
import { createResolver } from '../misc/createResolver'
import { EmptyObject, PositiveInteger } from '../misc/Types'
import * as t from 'io-ts'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'

const taxUserResolver = createResolver<Tax>(EmptyObject, User, getTaxUser)

const userTaxesResolver = createResolver<DatabaseUser>(
  ConnectionQueryArgs,
  Connection(Tax),
  getUserTaxes
)

const CreateTaxMutationInput = t.type(
  {
    tax: TaxCreationInput
  },
  'CreateTaxMutationInput'
)
const createTaxMutation = createResolver(
  CreateTaxMutationInput,
  Tax,
  (_parent, { tax }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createTax(tax, user))
    )
)

const UpdateTaxMutationInput = t.type(
  { id: PositiveInteger, tax: TaxUpdateInput },
  'UpdateTaxMutationInput'
)
const updateTaxMutation = createResolver(
  UpdateTaxMutationInput,
  Tax,
  (_parent, { id, tax }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateTax(id, tax, user))
    )
)

const DeleteTaxMutationInput = t.type(
  { id: PositiveInteger },
  'DeleteTaxMutationInput'
)
const deleteTaxMutation = createResolver(
  DeleteTaxMutationInput,
  Tax,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteTax(id, user))
    )
)

const TaxQueryInput = t.type({ id: PositiveInteger }, 'TaxQueryInput')
const taxQuery = createResolver(
  TaxQueryInput,
  Tax,
  (_parent, { id }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getTax(id, user))
    )
)

const taxesQuery = createResolver(
  ConnectionQueryArgs,
  Connection(Tax),
  (_parent, args, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listTaxes(args, user))
    )
)

const resolvers = {
  Tax: {
    user: taxUserResolver
  },
  User: {
    taxes: userTaxesResolver
  },
  Mutation: {
    createTax: createTaxMutation,
    updateTax: updateTaxMutation,
    deleteTax: deleteTaxMutation
  },
  Query: {
    tax: taxQuery,
    taxes: taxesQuery
  }
}

export default resolvers
