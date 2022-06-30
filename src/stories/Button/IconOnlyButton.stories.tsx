import { Meta, Story } from '@storybook/react'
import { constVoid } from 'fp-ts/function'
import { star } from 'ionicons/icons'
import { Button } from '../../components/Button/Button/Button'
import { Content } from '../../components/Content/Content'
import { CoolerStory } from '../CoolerStory'
import { ButtonArgs, buttonArgTypes } from './args'

const IconOnlyButtonTemplate: Story<
  Omit<ButtonArgs, 'label' | 'icon' | 'flat'>
> = props => {
  return (
    <CoolerStory>
      <Content>
        <Button
          type="iconButton"
          icon={star}
          action={constVoid}
          color={props.color}
          disabled={props.disabled}
        />
      </Content>
    </CoolerStory>
  )
}

export const IconOnlyButton = IconOnlyButtonTemplate.bind({})

IconOnlyButton.args = {
  color: 'default',
  disabled: false
}

IconOnlyButton.argTypes = {
  color: buttonArgTypes.color,
  disabled: buttonArgTypes.disabled
}

const meta: Meta = {
  title: 'Cooler/Buttons/Icon Only Button'
}

export default meta
