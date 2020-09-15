import { GraphQLFieldResolver } from 'graphql'
import { Tax, TaxCreationInput, TaxUpdateInput } from './interface'
import { Context, User, UserFromDatabase } from '../user/interface'
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

type TaxUserResolver = GraphQLFieldResolver<Tax, any>

const taxUserResolver: TaxUserResolver = (tax): Promise<User> => {
  return getTaxUser(tax)
}

type UserTaxesResolver = GraphQLFieldResolver<
  UserFromDatabase,
  Context,
  ConnectionQueryArgs
>

const userTaxesResolver: UserTaxesResolver = (
  user,
  args
): Promise<Connection<Tax>> => {
  return getUserTaxes(user, args)
}

type CreateTaxMutation = GraphQLFieldResolver<
  any,
  Context,
  { tax: TaxCreationInput }
>

const createTaxMutation: CreateTaxMutation = (
  _parent,
  { tax },
  context
): Promise<Tax | null> => {
  return createTax(tax, ensureUser(context))
}

type UpdateTaxMutation = GraphQLFieldResolver<
  any,
  Context,
  { id: number; tax: TaxUpdateInput }
>

const updateTaxMutation: UpdateTaxMutation = (
  _parent,
  { id, tax },
  context
): Promise<Tax | null> => {
  return updateTax(id, tax, ensureUser(context))
}

type DeleteTaxMutation = GraphQLFieldResolver<any, Context, { id: number }>

const deleteTaxMutation: DeleteTaxMutation = (
  _parent,
  { id },
  context
): Promise<Tax | null> => {
  return deleteTax(id, ensureUser(context))
}

type TaxQuery = GraphQLFieldResolver<any, Context, { id: number }>

const taxQuery: TaxQuery = (_parent, { id }, context): Promise<Tax | null> => {
  return getTax(id, ensureUser(context))
}

type TaxesQuery = GraphQLFieldResolver<any, Context, ConnectionQueryArgs>

const taxesQuery: TaxesQuery = (
  _parent,
  args,
  context
): Promise<Connection<Tax>> => {
  return listTaxes(args, ensureUser(context))
}

interface TaxResolvers {
  Tax: {
    user: TaxUserResolver
  }
  User: {
    taxes: UserTaxesResolver
  }
  Mutation: {
    createTax: CreateTaxMutation
    updateTax: UpdateTaxMutation
    deleteTax: DeleteTaxMutation
  }
  Query: {
    tax: TaxQuery
    taxes: TaxesQuery
  }
}

const resolvers: TaxResolvers = {
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
