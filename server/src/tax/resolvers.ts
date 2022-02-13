import { Tax, TaxCreationInput, TaxUpdateInput } from './interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import { createTax, updateTax, deleteTax, getTax, listTaxes } from './model'
import { ensureUser } from '../misc/ensureUser'
import { Connection } from '../misc/Connection'
import { createResolver } from '../misc/createResolver'
import { IdInput } from '../misc/Types'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { Resolvers } from '../assignResolvers'

const createTaxResolver = createResolver(
  {
    body: TaxCreationInput,
    output: Tax
  },
  ({ body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => createTax(body, user))
    )
)

const updateTaxResolver = createResolver(
  {
    params: IdInput,
    body: TaxUpdateInput,
    output: Tax
  },
  ({ params: { id }, body }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => updateTax(id, body, user))
    )
)

const deleteTaxResolver = createResolver(
  {
    params: IdInput,
    output: Tax
  },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => deleteTax(id, user))
    )
)

const getTaxResolver = createResolver(
  { params: IdInput, output: Tax },
  ({ params: { id } }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => getTax(id, user))
    )
)

const getTaxesResolver = createResolver(
  {
    query: ConnectionQueryArgs,
    output: Connection(Tax)
  },
  ({ query }, context) =>
    pipe(
      ensureUser(context),
      taskEither.chain(user => listTaxes(query, user))
    )
)

const resolvers: Resolvers = {
  path: '/taxes',
  POST: {
    '/': createTaxResolver
  },
  PUT: {
    '/:id': updateTaxResolver
  },
  DELETE: {
    '/:id': deleteTaxResolver
  },
  GET: {
    '/:id': getTaxResolver,
    '/': getTaxesResolver
  }
}

export default resolvers
