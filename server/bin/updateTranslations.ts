import fs from 'fs'
import path from 'path'
import gettextParser from 'gettext-parser'

const DEFAULT_LANGUAGE = 'en'
const LOCALES_DIRECTORY = path.join(process.cwd(), 'public/locales')

const files = fs
  .readdirSync(LOCALES_DIRECTORY)
  .filter(
    file =>
      path.extname(file) === '.po' &&
      path.basename(file, '.po') !== DEFAULT_LANGUAGE
  )

files.forEach(file => {
  const lang = path.basename(file, '.po')
  const content = fs.readFileSync(path.join(LOCALES_DIRECTORY, file), 'utf-8')
  const input = gettextParser.po.parse(content)

  const json = Object.entries(input.translations[''])
    .filter(([, value]) => !!value.msgid)
    .reduce(
      (res, [, value]) => ({
        ...res,
        [value.msgid]: value.msgstr[0]
      }),
      {}
    )

  fs.writeFileSync(
    path.join(LOCALES_DIRECTORY, `${lang}.json`),
    JSON.stringify(json, null, 2)
  )
})
