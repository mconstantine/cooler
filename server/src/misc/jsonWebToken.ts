import { either, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { NonEmptyString } from 'io-ts-types'
import { sign, SignOptions, verify, VerifyOptions } from 'jsonwebtoken'
import { Token } from '../user/interface'

export function signToken(token: Token, options?: SignOptions): NonEmptyString {
  return sign(token, process.env.SECRET!, options) as NonEmptyString
}

export function verifyToken(
  token: NonEmptyString,
  options?: VerifyOptions
): Option<Token> {
  return pipe(
    either.tryCatch(
      () => verify(token, process.env.SECRET!, options) as Token,
      constVoid
    ),
    option.fromEither
  )
}
