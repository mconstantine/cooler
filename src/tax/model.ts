import { Tax, TaxCreationInput, TaxUpdateInput } from './interface'
import { DatabaseUser, User } from '../user/interface'
import { ConnectionQueryArgs } from '../misc/ConnectionQueryArgs'
import SQL from 'sql-template-strings'
import { ApolloError } from 'apollo-server-express'
import { queryToConnection } from '../misc/queryToConnection'
import { Connection } from '../misc/Connection'
import {
  insertTax,
  getTaxById,
  updateTax as updateDatabaseTax,
  deleteTax as deleteDatabaseTax
} from './database'
import { TaskEither } from 'fp-ts/TaskEither'
import { pipe } from 'fp-ts/function'
import { taskEither } from 'fp-ts'
import { coolerError, PositiveInteger } from '../misc/Types'
import { getUserById } from '../user/database'

export function createTax(
  input: TaxCreationInput,
  user: User
): TaskEither<ApolloError, Tax> {
  return pipe(
    insertTax({ ...input, user: user.id }),
    taskEither.chain(getTaxById),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_500', 'Unable to retrieve the tax after creation')
      )
    )
  )
}

export function getTax(
  id: PositiveInteger,
  user: User
): TaskEither<ApolloError, Tax> {
  return pipe(
    getTaxById(id),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'Tax not found'))
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        tax => tax.user === user.id,
        () => coolerError('COOLER_403', 'You cannot see this tax')
      )
    )
  )
}

export function listTaxes(
  args: ConnectionQueryArgs,
  user: User
): TaskEither<ApolloError, Connection<Tax>> {
  return queryToConnection(
    args,
    ['tax.*'],
    'tax',
    Tax,
    SQL`WHERE user = ${user.id}`
  )
}

export function updateTax(
  id: PositiveInteger,
  input: TaxUpdateInput,
  user: User
): TaskEither<ApolloError, Tax> {
  return pipe(
    getTaxById(id),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'Tax not found'))
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        tax => tax.user === user.id,
        () => coolerError('COOLER_403', 'You cannot update this tax')
      )
    ),
    taskEither.chain(tax =>
      updateDatabaseTax(tax.id, { ...input, user: user.id })
    ),
    taskEither.chain(() => getTaxById(id)),
    taskEither.chain(
      taskEither.fromOption(() =>
        coolerError('COOLER_500', 'Unable to retrieve the tax after update')
      )
    )
  )
}

export function deleteTax(
  id: PositiveInteger,
  user: User
): TaskEither<ApolloError, Tax> {
  return pipe(
    getTaxById(id),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'Tax not found'))
    ),
    taskEither.chain(
      taskEither.fromPredicate(
        tax => tax.user === user.id,
        () => coolerError('COOLER_403', 'You cannot delete this tax')
      )
    ),
    taskEither.chain(tax =>
      pipe(
        deleteDatabaseTax(tax.id),
        taskEither.map(() => tax)
      )
    )
  )
}

export function getTaxUser(tax: Tax): TaskEither<ApolloError, User> {
  return pipe(
    getUserById(tax.user),
    taskEither.chain(
      taskEither.fromOption(() => coolerError('COOLER_404', 'User not found'))
    )
  )
}

export function getUserTaxes(
  user: DatabaseUser,
  args: ConnectionQueryArgs
): TaskEither<ApolloError, Connection<Tax>> {
  return queryToConnection(
    args,
    ['tax.*'],
    'tax',
    Tax,
    SQL`WHERE tax.user = ${user.id}`
  )
}
