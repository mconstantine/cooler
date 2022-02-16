import { either } from 'fp-ts'
import { Either } from 'fp-ts/Either'
import { Errors } from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'

export function reportErrors<T>(result: Either<Errors, T>): Either<Errors, T> {
  if (either.isLeft(result)) {
    console.error(PathReporter.report(result))
  }

  return result
}
