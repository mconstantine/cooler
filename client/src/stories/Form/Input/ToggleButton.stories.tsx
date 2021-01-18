import { Meta, Story } from '@storybook/react'
import { boolean, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { star } from 'ionicons/icons'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { ToggleButton as ToggleButtonComponent } from '../../../components/Form/Input/ToggleButton'
import { LocalizedString } from '../../../globalDomain'
import { ButtonArgs, buttonArgTypes } from '../../Button/args'
import { CoolerStory } from '../../CoolerStory'

interface Args extends ButtonArgs {
  iconOnly: boolean
  error: LocalizedString
  warning: LocalizedString
}

export const ToggleButton: Story<Args> = props => {
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
                disabled={props.disabled}
              />
            )
          )
        )}
      </Content>
    </CoolerStory>
  )
}

const meta: Meta<Args> = {
  title: 'Cooler/Form/Inputs/Toggle Button',
  args: {
    label: unsafeLocalizedString('Toggle Button'),
    icon: false,
    iconOnly: false,
    color: 'default',
    error: unsafeLocalizedString(''),
    warning: unsafeLocalizedString(''),
    flat: false,
    disabled: false
  },
  argTypes: {
    ...buttonArgTypes,
    iconOnly: {
      control: 'boolean'
    },
    error: {
      control: 'text'
    },
    warning: {
      control: 'text'
    }
  }
}

export default meta
