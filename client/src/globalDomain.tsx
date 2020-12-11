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

export const Color = t.keyof(
  {
    default: true,
    primary: true,
    success: true,
    warning: true,
    danger: true
  },
  'Color'
)
export type Color = t.TypeOf<typeof Color>
