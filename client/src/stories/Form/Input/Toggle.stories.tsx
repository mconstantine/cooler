import { Meta, Story } from '@storybook/react'
import { either, option } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { NonEmptyString } from 'io-ts-types'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { Toggle as ToggleComponent } from '../../../components/Form/Input/Toggle/Toggle'
import { Panel } from '../../../components/Panel/Panel'
import { LocalizedString } from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

interface Args {
  label: LocalizedString
  error: LocalizedString
  warning: LocalizedString
  disabled: boolean
}

const ToggleTemplate: Story<Args> = props => {
  const [value, setValue] = useState(false)

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <ToggleComponent
            label={props.label}
            name="toggle"
            value={value}
            onChange={setValue}
            error={pipe(
              props.error,
              NonEmptyString.decode,
              either.fold(
                () => option.none,
                () => option.some(props.error)
              )
            )}
            warning={pipe(
              props.warning,
              NonEmptyString.decode,
              either.fold(
                () => option.none,
                () => option.some(props.warning)
              )
            )}
            disabled={props.disabled}
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

export const Toggle = ToggleTemplate.bind({})

Toggle.args = {
  label: unsafeLocalizedString(
    'Lorem ipsum dolor sit amet consectetur, adipisicing elit.'
  ),
  error: unsafeLocalizedString(''),
  warning: unsafeLocalizedString(''),
  disabled: false
}

Toggle.argTypes = {
  label: {
    name: 'Label',
    control: 'text'
  },
  error: {
    name: 'Error',
    control: 'text'
  },
  warning: {
    name: 'Warning',
    control: 'text'
  },
  disabled: {
    name: 'Disabled',
    control: 'boolean'
  }
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Toggle'
}

export default meta
