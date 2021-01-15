import { Meta, Story } from '@storybook/react'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { star } from 'ionicons/icons'
import { useState } from 'react'
import { Content } from '../../../components/Content/Content'
import { ToggleButton as ToggleButtonComponent } from '../../../components/Form/Input/ToggleButton'
import { Color, LocalizedString } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

interface Props {
  label: LocalizedString
  icon: boolean
  iconOnly: boolean
  color: Color
  error: LocalizedString
  warning: LocalizedString
  flat: boolean
  disabled: boolean
}

export const ToggleButton: Story<Props> = props => {
  const [state, setState] = useState(false)

  return (
    <CoolerStory>
      <Content>
        {pipe(
          props.icon && props.iconOnly,
          boolean.fold(
            () => (
              <ToggleButtonComponent
                type="button"
                name="ToggleButton"
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
                error={pipe(
                  !!props.error,
                  boolean.fold(
                    () => option.none,
                    () => option.some(props.error)
                  )
                )}
                warning={pipe(
                  !!props.warning,
                  boolean.fold(
                    () => option.none,
                    () => option.some(props.warning)
                  )
                )}
                color={props.color}
                flat={props.flat}
                disabled={props.disabled}
              />
            ),
            () => (
              <ToggleButtonComponent
                type="iconButton"
                name="ToggleButton"
                value={state}
                onChange={setState}
                icon={star}
                error={pipe(
                  !!props.error,
                  boolean.fold(
                    () => option.none,
                    () => option.some(props.error)
                  )
                )}
                warning={pipe(
                  !!props.warning,
                  boolean.fold(
                    () => option.none,
                    () => option.some(props.warning)
                  )
                )}
                color={props.color}
                flat={props.flat}
                disabled={props.disabled}
              />
            )
          )
        )}
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Toggle Button',
  args: {
    label: 'Toggle Button',
    icon: false,
    iconOnly: false,
    color: 'default',
    error: '',
    warning: '',
    flat: false,
    disabled: false
  },
  argTypes: {
    label: {
      control: 'text'
    },
    icon: {
      control: 'boolean'
    },
    iconOnly: {
      control: 'boolean'
    },
    color: {
      control: {
        type: 'select',
        options: {
          Default: 'default',
          Primary: 'primary',
          Success: 'success'
        }
      }
    },
    error: {
      control: 'text'
    },
    warning: {
      control: 'text'
    },
    flat: {
      control: 'boolean'
    },
    disabled: {
      control: 'boolean'
    }
  }
}

export default meta
