import { either, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/lib/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { LocalizedString } from '../../globalDomain'
import * as t from 'io-ts'
import { Option } from 'fp-ts/Option'

export type Validator<I, O = I> = (i: I) => TaskEither<LocalizedString, O>

export type ValidatorOutput<
  I,
  V extends Validator<I, unknown>
> = V extends Validator<I, infer O> ? O : never

export function inSequence<O1, O2>(
  v1: Validator<string, O1>,
  v2: Validator<O1, O2>
): Validator<string, O2>
export function inSequence(
  v1: Validator<string, any>,
  ...validators: Validator<any, any>[]
): Validator<string, any> {
  return input =>
    validators.reduce(
      (res, validator) => pipe(res, taskEither.chain(validator)),
      v1(input)
    )
}

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

export function toUpperCase(): Validator<string, string> {
  return input => taskEither.right(input.toUpperCase())
}

export function nonBlankString(
  errorMessage: LocalizedString
): Validator<string, NonEmptyString> {
  return flow(s => s.trim(), fromCodec(NonEmptyString, errorMessage))
}

export function optionalString(): Validator<string, Option<NonEmptyString>> {
  return flow(NonEmptyString.decode, option.fromEither, taskEither.right)
}

export function passThrough<I = string, O = I>(): Validator<I, O> {
  return input => taskEither.rightIO(() => (input as unknown) as O)
}
