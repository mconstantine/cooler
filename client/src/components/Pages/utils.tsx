import { Tax } from '../../entities/Tax'

export function getNetValue(grossValue: number, taxes: Tax[]): number {
  return taxes.reduce((res, { value }) => res - grossValue * value, grossValue)
}
