import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import {
  airplane,
  checkmark,
  heart,
  skull,
  star,
  warning
} from 'ionicons/icons'
import { unsafeLocalizedString } from '../../a18n'
import { Button as ButtonComponent } from '../../components/Button/Button/Button'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { Content } from '../../components/Content/Content'
import { CoolerStory } from '../CoolerStory'

export const Button: Story = ({ onClick }) => {
  return (
    <CoolerStory>
      <Content>
        <Buttons>
          <ButtonComponent
            type="button"
            label={unsafeLocalizedString('Default color')}
            icon={option.none}
            action={() => onClick('default')}
          />
          <ButtonComponent
            type="button"
            color="primary"
            label={unsafeLocalizedString('Primary color')}
            icon={option.none}
            action={() => onClick('primary')}
          />
          <ButtonComponent
            type="button"
            color="success"
            label={unsafeLocalizedString('Success color')}
            icon={option.none}
            action={() => onClick('success')}
          />
          <ButtonComponent
            type="button"
            color="warning"
            label={unsafeLocalizedString('Warning color')}
            icon={option.none}
            action={() => onClick('warning')}
          />
          <ButtonComponent
            type="button"
            color="danger"
            label={unsafeLocalizedString('Danger color')}
            icon={option.none}
            action={() => onClick('danger')}
          />

          <ButtonComponent
            type="button"
            label={unsafeLocalizedString('Default disabled')}
            icon={option.none}
            action={() => onClick('default disabled')}
            disabled
          />
          <ButtonComponent
            type="button"
            color="primary"
            label={unsafeLocalizedString('Primary disabled')}
            icon={option.none}
            action={() => onClick('primary disabled')}
            disabled
          />
          <ButtonComponent
            type="button"
            color="success"
            label={unsafeLocalizedString('Success disabled')}
            icon={option.none}
            action={() => onClick('success disabled')}
            disabled
          />
          <ButtonComponent
            type="button"
            color="warning"
            label={unsafeLocalizedString('Warning disabled')}
            icon={option.none}
            action={() => onClick('warning disabled')}
            disabled
          />
          <ButtonComponent
            type="button"
            color="danger"
            label={unsafeLocalizedString('Danger disabled')}
            icon={option.none}
            action={() => onClick('danger disabled')}
            disabled
          />
          <ButtonComponent
            type="button"
            flat
            label={unsafeLocalizedString('Flat button')}
            icon={option.none}
            action={() => onClick('flat')}
          />
          <ButtonComponent
            type="button"
            flat
            label={unsafeLocalizedString('Flat disabled')}
            icon={option.none}
            action={() => onClick('flat disabled')}
            disabled
          />
        </Buttons>
      </Content>
    </CoolerStory>
  )
}

export const ButtonWithIcon: Story = ({ onClick }) => {
  return (
    <CoolerStory>
      <Content>
        <Buttons>
          <ButtonComponent
            type="button"
            label={unsafeLocalizedString('Default color')}
            icon={option.some(star)}
            action={() => onClick('default')}
          />
          <ButtonComponent
            type="button"
            color="primary"
            label={unsafeLocalizedString('Primary color')}
            icon={option.some(airplane)}
            action={() => onClick('primary')}
          />
          <ButtonComponent
            type="button"
            color="success"
            label={unsafeLocalizedString('Success color')}
            icon={option.some(checkmark)}
            action={() => onClick('success')}
          />
          <ButtonComponent
            type="button"
            color="warning"
            flat
            label={unsafeLocalizedString('Warning color, flat')}
            icon={option.some(warning)}
            action={() => onClick('warning')}
          />
          <ButtonComponent
            type="button"
            color="danger"
            flat
            label={unsafeLocalizedString('Danger color, flat')}
            icon={option.some(skull)}
            action={() => onClick('danger')}
          />
        </Buttons>
      </Content>
    </CoolerStory>
  )
}

export const SelectedButton: Story = ({ onClick }) => {
  return (
    <CoolerStory>
      <Content>
        <Buttons>
          <ButtonComponent
            type="button"
            label={unsafeLocalizedString('Default color')}
            icon={option.some(star)}
            action={() => onClick('default')}
            active
          />
          <ButtonComponent
            type="button"
            color="primary"
            label={unsafeLocalizedString('Primary color')}
            icon={option.some(airplane)}
            action={() => onClick('primary')}
            active
          />
          <ButtonComponent
            type="button"
            color="success"
            label={unsafeLocalizedString('Success color')}
            icon={option.some(checkmark)}
            action={() => onClick('success')}
            active
          />
          <ButtonComponent
            type="button"
            color="warning"
            flat
            label={unsafeLocalizedString('Warning color, flat')}
            icon={option.some(warning)}
            action={() => onClick('warning')}
            active
          />
          <ButtonComponent
            type="button"
            color="danger"
            flat
            label={unsafeLocalizedString('Danger color, flat, disabled')}
            icon={option.some(skull)}
            action={() => onClick('danger')}
            active
            disabled
          />
        </Buttons>
      </Content>
    </CoolerStory>
  )
}

export const IconOnlyButton: Story = ({ onClick }) => {
  return (
    <CoolerStory>
      <Content>
        <Buttons>
          <ButtonComponent
            type="iconButton"
            icon={star}
            action={() => onClick('default')}
          />
          <ButtonComponent
            type="iconButton"
            color="primary"
            icon={airplane}
            action={() => onClick('primary')}
          />
          <ButtonComponent
            type="iconButton"
            flat
            icon={heart}
            action={() => onClick('flat')}
          />
          <ButtonComponent
            type="iconButton"
            color="success"
            icon={checkmark}
            action={() => onClick('success')}
          />
          <ButtonComponent
            type="iconButton"
            color="warning"
            icon={warning}
            action={() => onClick('warning')}
          />
          <ButtonComponent
            type="iconButton"
            color="danger"
            icon={skull}
            action={() => onClick('danger')}
          />
        </Buttons>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Buttons/Button',
  argTypes: {
    onClick: {
      action: 'clicked'
    }
  }
}

export default meta
