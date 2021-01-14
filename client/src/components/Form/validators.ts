import { either, option, taskEither } from 'fp-ts'
import { flow, pipe } from 'fp-ts/lib/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { LocalizedString } from '../../globalDomain'
import * as t from 'io-ts'
import { Option } from 'fp-ts/Option'
import { getOptionValue, SelectState } from './Input/Select/Select'

export type Validator<I, O = I> = (i: I) => TaskEither<LocalizedString, O>

export type ValidatorOutput<
  I,
  V extends Validator<I, unknown>
> = V extends Validator<I, infer O> ? O : never

export function inSequence<I, O1, O2>(
  v1: Validator<I, O1>,
  v2: Validator<O1, O2>
): Validator<I, O2>
export function inSequence(
  v1: Validator<any, any>,
  ...validators: Validator<any, any>[]
): Validator<any, any> {
  return input =>
    validators.reduce(
      (res, validator) => pipe(res, taskEither.chain(validator)),
      v1(input)
    )
}

export function fromCodec<O = string, I = string>(
  codec: t.Type<O, I, unknown>,
  errorMessage: LocalizedString
): Validator<I, O> {
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

export function fromRegex(
  regex: RegExp,
  errorMessage: LocalizedString
): Validator<string, string> {
  return taskEither.fromPredicate(
    input => regex.test(input),
    () => errorMessage
  )
}

export function fromSelectState<T extends string | number | symbol>(
  errorMessage: LocalizedString
): Validator<SelectState<T>, T> {
  return flow(
    getOptionValue,
    taskEither.fromOption(() => errorMessage)
  )
}
