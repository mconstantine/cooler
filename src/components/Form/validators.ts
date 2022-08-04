import { either, option, taskEither } from 'fp-ts'
import { flow, pipe, Predicate } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { NonEmptyString } from 'io-ts-types'
import { LocalizedString } from '../../globalDomain'
import * as t from 'io-ts'
import { Option } from 'fp-ts/Option'
import { getOptionValue, SelectState } from './Input/Select/Select'
import { unsafeLocalizedString } from '../../a18n'
import { commonErrors } from '../../misc/commonErrors'

export type Validator<I, O = I> = (i: I) => TaskEither<LocalizedString, O>

export type ValidatorOutput<V extends Validator<any, any>> =
  V extends Validator<any, infer O> ? O : never

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

export function optional<I, O>(
  validator: Validator<I, O>
): Validator<I | null, Option<O>> {
  return input =>
    input
      ? pipe(validator(input), taskEither.map(option.some))
      : taskEither.right(option.none)
}

export function fromPredicate<I>(
  predicate: Predicate<I>,
  errorMessage: LocalizedString
): Validator<I> {
  return taskEither.fromPredicate(predicate, () => errorMessage)
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
): Validator<string, NonEmptyString & LocalizedString> {
  return flow(
    s => s.trim(),
    fromCodec(NonEmptyString, errorMessage),
    taskEither.map(
      s => unsafeLocalizedString(s) as NonEmptyString & LocalizedString
    )
  )
}

export function optionalString(): Validator<
  string,
  Option<NonEmptyString & LocalizedString>
> {
  return optional(nonBlankString(commonErrors.nonBlank))
}

export function passThrough<I = string, O = I>(): Validator<I, O> {
  return input => taskEither.rightIO(() => input as unknown as O)
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
