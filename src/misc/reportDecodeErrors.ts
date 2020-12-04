import { Either } from 'fp-ts/Either'
import { Errors } from 'io-ts'
import { PathReporter } from 'io-ts/PathReporter'

export function reportDecodeErrors<T>(
  origin: string
): (result: Either<Errors, T>) => Either<Errors, T> {
  return result => {
    const errors = PathReporter.report(result)

    if (errors.length && errors[0] !== 'No errors!') {
      console.log(`Decoding error from ${origin}`)
      errors.map(error => console.error(error))
    }

    return result
  }
}
