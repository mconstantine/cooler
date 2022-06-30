import { Meta, Story } from '@storybook/react'
import { boolean, option } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { star } from 'ionicons/icons'
import { unsafeLocalizedString } from '../../a18n'
import { Button as ButtonComponent } from '../../components/Button/Button/Button'
import { Content } from '../../components/Content/Content'
import { CoolerStory } from '../CoolerStory'
import { ButtonArgs, buttonArgTypes } from './args'

const ButtonTemplate: Story<ButtonArgs> = props => {
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

export const Button = ButtonTemplate.bind({})

Button.args = {
  label: unsafeLocalizedString('Button'),
  icon: false,
  color: 'default',
  flat: false,
  disabled: false
}

Button.argTypes = buttonArgTypes

const meta: Meta = {
  title: 'Cooler/Buttons/Button'
}

export default meta
