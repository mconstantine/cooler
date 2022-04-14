import { either, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Reader } from 'fp-ts/Reader'
import { TaskEither } from 'fp-ts/TaskEither'
import { unsafeLocalizedString } from '../misc/a18n'
import { CoolerError, coolerError } from '../misc/Types'

export function testError(): CoolerError {
  return coolerError('COOLER_500', unsafeLocalizedString('Test failed'))
}

export function pipeLog<A>(a: A): A {
  console.log(a)
  return a
}

export function testTaskEither<E, A, B>(
  testFunction: Reader<A, B>
): (te: TaskEither<E, A>) => Promise<B>
export function testTaskEither<E, A, B>(
  testValue: A
): (te: TaskEither<E, A>) => Promise<A>
export function testTaskEither<E, A, B>(
  test: Reader<A, B> | A
): (te: TaskEither<E, A>) => Promise<B> {
  return async te => {
    const result = await te()

    if (either.isLeft(result)) {
      console.log(result.left)
    }

    expect(either.isRight(result)).toBe(true)

    return pipe(
      result,
      either.fold(
        error => {
          console.log(error)
          return (null as unknown) as B
        },
        res => {
          if (typeof test === 'function') {
            const testFunction = test as Reader<A, B>
            return testFunction(res)
          } else {
            expect(res).toEqual(test)
            return (res as unknown) as B
          }
        }
      )
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
