import { ApolloError } from 'apollo-server-express'
import { either, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { coolerError } from '../misc/Types'

export function testError(): ApolloError {
  return coolerError('COOLER_500', 'Test failed')
}

export function pipeLog<A>(a: A): A {
  console.log(a)
  return a
}

export function testTaskEither<E, A, B>(
  testFunction: (result: A) => B
): (te: TaskEither<E, A>) => Promise<B> {
  return async te => {
    const result = await te()

    // expect(either.isRight(result)).toBe(true)

    return pipe(
      result,
      either.fold(error => {
        console.log(error)
        return (null as unknown) as B
      }, testFunction)
    )
  }
}

export function testTaskEitherError<E, A>(
  testFunction: (error: E) => void
): (te: TaskEither<E, A>) => Promise<void> {
  return async te => {
    const result = await te()
    expect(either.isLeft(result)).toBe(true)
    return pipe(result, either.fold(testFunction, console.log))
  }
}

export function pipeTestTaskEither<E, A>(
  testFunction: (result: A) => unknown
): (te: TaskEither<E, A>) => TaskEither<E, A> {
  return te =>
    pipe(
      te,
      taskEither.map(result => {
        testFunction(result)
        return result
      })
    )
}

export function pipeTestTaskEitherError<E, A>(
  testFunction: (error: E) => unknown
): (te: TaskEither<E, A>) => TaskEither<E, A> {
  return te =>
    pipe(
      te,
      taskEither.mapLeft(error => {
        testFunction(error)
        return error
      })
    )
}
