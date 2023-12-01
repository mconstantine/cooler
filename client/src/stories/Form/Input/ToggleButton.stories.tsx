import { Meta, StoryObj } from '@storybook/react'
import { boolean, either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { NonEmptyString } from 'io-ts-types'
import { star } from 'ionicons/icons'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { ToggleButton } from '../../../components/Form/Input/ToggleButton'
import { LocalizedString } from '../../../globalDomain'
import { ButtonArgs, buttonArgTypes } from '../../Button/args'

interface ToggleButtonStoryArgs extends ButtonArgs {
  iconOnly: boolean
  error: LocalizedString
  warning: LocalizedString
}

const meta: Meta<ToggleButtonStoryArgs> = {
  title: 'Cooler/Forms/Input/ToggleButton',
  component: ToggleButton as any,
  parameters: {},
  tags: ['autodocs'],
  argTypes: {
    ...buttonArgTypes,
    iconOnly: {
      name: 'Icon only',
      control: 'boolean'
    },
    error: {
      name: 'Error',
      control: 'text'
    },
    warning: {
      name: 'Warning',
      control: 'text'
    }
  }
}

export default meta
type Story = StoryObj<ToggleButtonStoryArgs>

export const Default: Story = {
  render: function Story(props) {
    const [state, setState] = useState(false)

    const error: Option<LocalizedString> = pipe(
      props.error,
      NonEmptyString.decode,
      either.fold(
        () => option.none,
        () => option.some(props.error)
      )
    )

    const warning: Option<LocalizedString> = pipe(
      props.warning,
      NonEmptyString.decode,
      either.fold(
        () => option.none,
        () => option.some(props.warning)
      )
    )

    return (
      <Content>
        {pipe(
          props.icon && props.iconOnly,
          boolean.fold(
            () => (
              <ToggleButton
                type="button"
                name="ToggleButtonButton"
                value={state}
                onChange={setState}
                label={props.label}
                icon={pipe(
                  props.icon,
                  boolean.fold(
                    () => option.none,
                    () => option.some(star)
                  )
                )}
                error={error}
                warning={warning}
                color={props.color}
                flat={props.flat}
                disabled={props.disabled}
              />
            ),
            () => (
              <ToggleButton
                type="iconButton"
                name="ToggleButtonButton"
                value={state}
                onChange={setState}
                icon={star}
                error={error}
                warning={warning}
                color={props.color}
                disabled={props.disabled}
              />
            )
          )
        )}
      </Content>
    )
  },
  args: {
    label: unsafeLocalizedString('Label'),
    icon: false,
    iconOnly: false,
    color: 'default',
    error: unsafeLocalizedString(''),
    warning: unsafeLocalizedString(''),
    flat: false,
    disabled: false
  }
}
