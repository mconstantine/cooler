import { either, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { NonEmptyString } from 'io-ts-types'
import { sign, SignOptions, verify, VerifyOptions } from 'jsonwebtoken'
import { Token } from '../user/interface'
import { unsafeNonEmptyString } from './Types'

export function signToken(token: Token, options?: SignOptions): NonEmptyString {
  return unsafeNonEmptyString(sign(token, process.env.SECRET!, options))
}

export function verifyToken(
  token: NonEmptyString,
  options?: VerifyOptions
): Option<Token> {
  return pipe(
    either.tryCatch<any, Record<string, any>>(
      () => verify(token, process.env.SECRET!, options) as Record<string, any>,
      constVoid
    ),
    either.chain(Token.decode),
    option.fromEither
  )
}
