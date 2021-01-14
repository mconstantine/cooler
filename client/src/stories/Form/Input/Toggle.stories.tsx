import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { Toggle } from '../../../components/Form/Input/Toggle/Toggle'
import { Panel } from '../../../components/Panel/Panel'
import { CoolerStory } from '../../CoolerStory'

export const _Toggle: Story = () => {
  const [value, setValue] = useState(true)
  const [valueError, setValueError] = useState(false)
  const [valueWarning, setValueWarning] = useState(false)
  const [valueDisabled, setValueDisabled] = useState(false)

  return (
    <CoolerStory>
      <Content>
        <Panel framed>
          <Toggle
            label={unsafeLocalizedString(
              'Lorem ipsum dolor sit amet consectetur, adipisicing elit.'
            )}
            name="toggle"
            value={value}
            onChange={setValue}
            error={option.none}
            warning={option.none}
          />
          <Toggle
            label={unsafeLocalizedString('With error')}
            name="toggleError"
            value={valueError}
            onChange={setValueError}
            error={option.some(unsafeLocalizedString('This is an error'))}
            warning={option.none}
          />
          <Toggle
            label={unsafeLocalizedString('With warning')}
            name="toggleWarning"
            value={valueWarning}
            onChange={setValueWarning}
            error={option.none}
            warning={option.some(unsafeLocalizedString('This is a warning'))}
          />
          <Toggle
            label={unsafeLocalizedString('Disabled')}
            name="toggleDisabled"
            value={valueDisabled}
            onChange={setValueDisabled}
            error={option.none}
            warning={option.none}
            disabled
          />
        </Panel>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Form/Inputs/Toggle'
}

export default meta
