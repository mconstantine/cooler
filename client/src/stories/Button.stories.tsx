import { Meta, Story } from '@storybook/react'
import { option } from 'fp-ts'
import {
  airplane,
  checkmark,
  heart,
  link,
  skull,
  star,
  warning
} from 'ionicons/icons'
import { unsafeLocalizedString } from '../a18n'
import { Button as ButtonComponent } from '../components/Button/Button'
import { Buttons } from '../components/Buttons/Buttons'
import { Content } from '../components/Content/Content'
import { Separator } from '../components/Separator/Separator'
import { CoolerStory } from './CoolerStory'

export const Button: Story = ({ onClick }) => {
  return (
    <CoolerStory>
      <Content>
        <h4>Buttons</h4>
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

        <Separator />

        <h4>Buttons with icons (some flat)</h4>
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

        <Separator />

        <h4>Icons only</h4>
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

        <Separator />

        <h4>Link example</h4>
        <Buttons>
          <ButtonComponent
            type="link"
            label={unsafeLocalizedString('Go to a website')}
            icon={option.some(link)}
            href="https://www.example.com"
            target="_blank"
          />
          <ButtonComponent
            type="iconLink"
            icon={link}
            href="https://www.example.com"
            target="_blank"
            disabled
          />
        </Buttons>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Button',
  argTypes: {
    onClick: {
      action: 'clicked'
    }
  }
}

export default meta
