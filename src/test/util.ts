import { ApolloError } from 'apollo-server-express'
import { coolerError } from '../misc/Types'

export function testError(): ApolloError {
  return coolerError('COOLER_500', 'Test failed')
}

export function pipeLog<A>(a: A): A {
  console.log(a)
  return a
}
