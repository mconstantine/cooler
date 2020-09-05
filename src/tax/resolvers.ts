import { GraphQLFieldResolver } from 'graphql'
import { Tax } from './Tax'
import { User, UserContext } from '../user/User'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { getDatabase } from '../misc/getDatabase'
import SQL from 'sql-template-strings'
import { queryToConnection } from '../misc/queryToConnection'
import { createTax, updateTax, deleteTax, getTax, listTaxes } from './model'
import { ensureUser } from '../misc/ensureUser'

interface TaxResolvers {
  Tax: {
    user: GraphQLFieldResolver<Tax, any>
  }
  User: {
    taxes: GraphQLFieldResolver<User, UserContext, ConnectionQueryArgs>
  }
  Mutation: {
    createTax: GraphQLFieldResolver<any, UserContext, { tax: Partial<Tax> }>
    updateTax: GraphQLFieldResolver<any, UserContext, { id: number, tax: Partial<Tax> }>
    deleteTax: GraphQLFieldResolver<any, UserContext, { id: number }>
  }
  Query: {
    tax: GraphQLFieldResolver<any, UserContext, { id: number }>
    taxes: GraphQLFieldResolver<any, UserContext, ConnectionQueryArgs>
  }
}

export default {
  Tax: {
    user: async tax => {
      const db = await getDatabase()
      return db.get<User>(SQL`SELECT * FROM user WHERE id = ${tax.user}`)
    }
  },
  User: {
    taxes: (user, args) => {
      return queryToConnection(args, ['tax.*'], 'tax', SQL`WHERE tax.user = ${user.id}`)
    }
  },
  Mutation: {
    createTax: (_parent, { tax }, context) => {
      ensureUser(context)
      return createTax(tax, context.user!)
    },
    updateTax: (_parent, { id, tax }, context) => {
      ensureUser(context)
      return updateTax(id, tax, context.user!)
    },
    deleteTax: (_parent, { id }, context) => {
      ensureUser(context)
      return deleteTax(id, context.user!)
    }
  },
  Query: {
    tax: (_parent, { id }, context) => {
      ensureUser(context)
      return getTax(id, context.user!)
    },
    taxes: (_parent, args, context) => {
      ensureUser(context)
      return listTaxes(args, context.user!)
    }
  }
} as TaxResolvers
