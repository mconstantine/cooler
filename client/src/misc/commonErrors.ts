import { a18n } from '../a18n'

export const commonErrors = {
  nonBlank: a18n`This field cannot be empty or blank`,
  invalidEmail: a18n`This is not a valid e-mail address`,
  boolean: a18n`This should be either true or false. Are you trying to break stuff?`,
  moneyAmount: a18n`Money amounts should be positive numbers or zero`
}
