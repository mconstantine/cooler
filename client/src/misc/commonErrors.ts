import { a18n } from '../a18n'
import { LocalizedString } from '../globalDomain'

export const commonErrors: Record<string, LocalizedString> = {
  nonBlank: a18n`This field cannot be empty or blank`,
  invalidEmail: a18n`This is not a valid e-mail address`
}
