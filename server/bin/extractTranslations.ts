import fs from 'fs'
import path from 'path'
import gettextParser, { GetTextTranslation } from 'gettext-parser'

const DEFAULT_LANGUAGE = 'en'
const LOCALES_DIRECTORY = path.join(process.cwd(), 'public/locales')

const content = fs.readFileSync(
  path.join(LOCALES_DIRECTORY, `${DEFAULT_LANGUAGE}.json`),
  'utf-8'
)

const input = JSON.parse(content) as Record<string, string | null>

const po = gettextParser.po.compile({
  charset: 'utf-8',
  headers: {},
  translations: {
    '': Object.entries(input)
      .map(
        ([key, value]) =>
          [
            key,
            {
              msgid: key,
              msgstr: [value || '']
            }
          ] as [string, GetTextTranslation]
      )
      .reduce(
        (res, [key, value]) => ({
          ...res,
          [key]: value
        }),
        {}
      )
  }
})

fs.writeFileSync(path.join(LOCALES_DIRECTORY, `translations.pot`), po)
