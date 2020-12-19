import { either, taskEither } from 'fp-ts'
import { flow } from 'fp-ts/lib/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { LocalizedString } from '../../globalDomain'
import * as t from 'io-ts'

export type Validator<I, O = I> = (i: I) => TaskEither<LocalizedString, O>

export type ValidatorOutput<
  I,
  V extends Validator<I, unknown>
> = V extends Validator<I, infer O> ? O : never

export function fromCodec<A>(
  codec: t.Type<A, string, unknown>,
  errorMessage: LocalizedString
): Validator<string, A> {
  return flow(
    codec.decode,
    either.mapLeft(() => errorMessage),
    taskEither.fromEither
  )
}

export function nonBlankString(
  errorMessage: LocalizedString
): Validator<string, NonEmptyString> {
  return flow(s => s.trim(), fromCodec(NonEmptyString, errorMessage))
}

export function passThrough<A>(): Validator<A, A> {
  return input => taskEither.rightIO(() => input)
}
