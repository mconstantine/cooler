import { Color, LocalizedString } from '../../globalDomain'
import { colorControl } from '../args'
import { IO } from 'fp-ts/IO'
import { Reader } from 'fp-ts/Reader'

type LoadingButtonResult = 'Success' | 'Failure'

export function foldLoadingButtonResult<T>(
  whenSuccess: IO<T>,
  whenFailure: IO<T>
): Reader<LoadingButtonResult, T> {
  return result => {
    switch (result) {
      case 'Success':
        return whenSuccess()
      case 'Failure':
        return whenFailure()
    }
  }
}

export interface ButtonArgs {
  label: LocalizedString
  icon: boolean
  color: Color
  flat: boolean
  disabled: boolean
  result: LoadingButtonResult
}

export const buttonArgTypes = {
  label: {
    name: 'Label',
    control: 'text'
  },
  icon: {
    name: 'Icon',
    control: 'boolean',
    description: 'Whether to show an icon or not'
  },
  color: {
    name: 'Color',
    control: colorControl
  },
  flat: {
    name: 'Flat style',
    control: 'boolean'
  },
  disabled: {
    name: 'Disabled',
    control: 'boolean'
  }
}
