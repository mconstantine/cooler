import originalA18n, { LocaleResource } from 'a18n'
import { LocalizedString } from './Types'

export interface A18n {
  (text: string): LocalizedString
  (parts: TemplateStringsArray, ...values: (string | number)[]): LocalizedString
  x(parts: TemplateStringsArray, ...values: any[]): any[]
  addLocaleResource(locale: string, resource: LocaleResource): void
  setLocale(locale: string): void
  getLocale(): string
  getA18n(namespace: string): A18n
}

export const a18n: A18n = (originalA18n as unknown) as A18n

export function unsafeLocalizedString(s: string): LocalizedString {
  return s as LocalizedString
}

export const locales = ['en', 'it']

export function initI18n() {
  originalA18n.addLocaleResource('en', require('../../public/locales/en.json'))
  originalA18n.addLocaleResource('it', require('../../public/locales/it.json'))
  originalA18n.setLocale('en')
}
