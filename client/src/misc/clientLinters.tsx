import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { a18n } from '../a18n'
import { Linter } from '../components/Form/useForm'

const fiscalCodePattern = /[A-Z]{6}\d{2}[a-zA-Z]\d{2}[a-zA-Z]\d{3}/
const vatNumberPattern = /[0-9]{11}/

const EVEN_CHARS_MAP: Record<string, number> = {
  '0': 1,
  '1': 0,
  '2': 5,
  '3': 7,
  '4': 9,
  '5': 13,
  '6': 15,
  '7': 17,
  '8': 19,
  '9': 21,
  A: 1,
  B: 0,
  C: 5,
  D: 7,
  E: 9,
  F: 13,
  G: 15,
  H: 17,
  I: 19,
  J: 21,
  K: 2,
  L: 4,
  M: 18,
  N: 20,
  O: 11,
  P: 3,
  Q: 6,
  R: 8,
  S: 12,
  T: 14,
  U: 16,
  V: 10,
  W: 22,
  X: 25,
  Y: 24,
  Z: 23
}

const ODD_CHARS_MAP: Record<string, number> = {
  '0': 0,
  '1': 1,
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  A: 0,
  B: 1,
  C: 2,
  D: 3,
  E: 4,
  F: 5,
  G: 6,
  H: 7,
  I: 8,
  J: 9,
  K: 10,
  L: 11,
  M: 12,
  N: 13,
  O: 14,
  P: 15,
  Q: 16,
  R: 17,
  S: 18,
  T: 19,
  U: 20,
  V: 21,
  W: 22,
  X: 23,
  Y: 24,
  Z: 25
}

const FLAG_COMPUTATION_MAP = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z'
]

function getFiscalCodeCheckChar(fiscalCode: string): string {
  fiscalCode = fiscalCode.toUpperCase().substring(0, 15)

  if (!fiscalCode || !fiscalCodePattern.test(fiscalCode)) {
    return ''
  }

  const odd = fiscalCode
    .split('')
    .filter((_, i) => i % 2)
    .reduce(
      (res, char) => res + ODD_CHARS_MAP[char as keyof typeof ODD_CHARS_MAP],
      0
    )

  const even = fiscalCode
    .split('')
    .filter((_, i) => !(i % 2))
    .reduce(
      (res, char) => res + EVEN_CHARS_MAP[char as keyof typeof EVEN_CHARS_MAP],
      0
    )

  return FLAG_COMPUTATION_MAP[(odd + even) % 26]
}

const FISCAL_CODE_PATTERN = /[A-Z]{6}\d{2}[A-Z]{1}\d{2}[A-Z]{1}\d{3}[A-Z]{1}/

function isValidFiscalCode(fiscalCode: string): boolean {
  if (fiscalCode.length < 16) {
    return false
  }

  const ucFiscalCode = fiscalCode.toUpperCase()

  if (!FISCAL_CODE_PATTERN.test(ucFiscalCode)) {
    return false
  }

  const lastChar = ucFiscalCode.substring(ucFiscalCode.length - 1)
  const checkChar = getFiscalCodeCheckChar(ucFiscalCode)

  return lastChar === checkChar
}

export const fiscalCodeLinter: Linter<string> = input =>
  pipe(
    isValidFiscalCode(input),
    boolean.fold(
      () =>
        option.some(a18n`This does not look like a valid italian fiscal code`),
      () => option.none
    )
  )

function isValidVATNumber(input: string) {
  if (!vatNumberPattern.test(input)) {
    return false
  }

  const toSingleDigit = (c: string): number => {
    const digit = parseInt(c) * 2
    return digit < 10 ? digit : digit - 9
  }

  const x = [
    parseInt(input[0]),
    parseInt(input[2]),
    parseInt(input[4]),
    parseInt(input[6]),
    parseInt(input[8])
  ].reduce((res, n) => res + n, 0)

  const y = [
    toSingleDigit(input[1]),
    toSingleDigit(input[3]),
    toSingleDigit(input[5]),
    toSingleDigit(input[7]),
    toSingleDigit(input[9])
  ].reduce((res, n) => res + n, 0)

  const t = (x + y) % 10
  const c = (10 - t) % 10

  return c === parseInt(input[10])
}

export const vatNumberLinter: Linter<string> = input =>
  pipe(
    isValidVATNumber(input),
    boolean.fold(
      () =>
        option.some(a18n`This does not look like a valid italian VAT number`),
      () => option.none
    )
  )
