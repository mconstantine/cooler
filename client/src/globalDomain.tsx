import * as t from 'io-ts'

export type LocalizedStringBrand = string & {
  readonly LocalizedString: unique symbol
}

export const LocalizedString = t.brand(
  t.string,
  (_): _ is t.Branded<string, LocalizedStringBrand> => true,
  'LocalizedString'
)

export type LocalizedString = t.TypeOf<typeof LocalizedString>

export type Color = 'default' | 'primary' | 'success' | 'warning' | 'danger'
