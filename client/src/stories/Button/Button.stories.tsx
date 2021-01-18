import { Meta, Story } from '@storybook/react'
import { boolean, option } from 'fp-ts'
import { constVoid } from 'fp-ts/function'
import { pipe } from 'fp-ts/lib/pipeable'
import { star } from 'ionicons/icons'
import { unsafeLocalizedString } from '../../a18n'
import { Button as ButtonComponent } from '../../components/Button/Button/Button'
import { Content } from '../../components/Content/Content'
import { CoolerStory } from '../CoolerStory'
import { ButtonArgs, buttonArgTypes } from './args'

export const Button: Story<ButtonArgs> = props => {
  return (
    <CoolerStory>
      <Content>
        <ButtonComponent
          type="button"
          label={props.label}
          icon={pipe(
            props.icon,
            boolean.fold(
              () => option.none,
              () => option.some(star)
            )
          )}
          action={constVoid}
          color={props.color}
          flat={props.flat}
          disabled={props.disabled}
        />
      </Content>
    </CoolerStory>
  )
}

Button.args = {
  label: unsafeLocalizedString('Button'),
  icon: false,
  color: 'default',
  flat: false,
  disabled: false
}

Button.argTypes = buttonArgTypes

export const IconOnlyButton: Story<
  Omit<ButtonArgs, 'label' | 'icon' | 'flat'>
> = props => {
  return (
    <CoolerStory>
      <Content>
        <ButtonComponent
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

IconOnlyButton.args = {
  color: 'default',
  disabled: false
}

IconOnlyButton.argTypes = {
  color: buttonArgTypes.color,
  disabled: buttonArgTypes.disabled
}

const meta: Meta = {
  title: 'Cooler/Buttons/Button'
}

export default meta
