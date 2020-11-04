import { GraphQLFieldResolver } from 'graphql'
import { Tax, TaxCreationInput, TaxUpdateInput } from './interface'
import { Context, User, UserContext, UserFromDatabase } from '../user/interface'
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
import {
  publish,
  Subscription,
  SubscriptionImplementation,
  WithFilter
} from '../misc/pubsub'
import { withFilter } from 'apollo-server-express'
import { pubsub } from '../pubsub'
import { getDatabase } from '../misc/getDatabase'
import { definitely } from '../misc/definitely'
import SQL from 'sql-template-strings'

const TAX_CREATED = 'TAX_CREATED'

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

interface TaxSubscription extends Subscription<Tax> {
  createdTax: SubscriptionImplementation<Tax>
}

const taxSubscription: TaxSubscription = {
  createdTax: {
    subscribe: withFilter(() => pubsub.asyncIterator([TAX_CREATED]), (async (
      { createdTax },
      _args,
      context
    ) => {
      const db = await getDatabase()
      const { user } = definitely(
        await db.get<{ user: number }>(SQL`
          SELECT user FROM tax WHERE id = ${createdTax.id}
        `)
      )

      return user === context.user.id
    }) as WithFilter<{}, TaxSubscription, UserContext, Tax>)
  }
}

type CreateTaxMutation = GraphQLFieldResolver<
  any,
  Context,
  { tax: TaxCreationInput }
>

const createTaxMutation: CreateTaxMutation = async (
  _parent,
  { tax },
  context
): Promise<Tax | null> => {
  const res = await createTax(tax, ensureUser(context))

  res &&
    publish<Tax, TaxSubscription>(TAX_CREATED, {
      createdTax: res
    })

  return res
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
  Subscription: TaxSubscription
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
  },
  Subscription: taxSubscription
}

export default resolvers
