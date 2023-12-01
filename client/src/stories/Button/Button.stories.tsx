import { Meta, StoryObj } from '@storybook/react'
import { boolean, either, option, task, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import { send, star } from 'ionicons/icons'
import { unsafeLocalizedString } from '../../a18n'
import { Button } from '../../components/Button/Button/Button'
import { Content } from '../../components/Content/Content'
import { ButtonArgs, buttonArgTypes, foldLoadingButtonResult } from './args'
import { LoadingButton } from '../../components/Button/LoadingButton/LoadingButton'
import { NonEmptyString } from 'io-ts-types'
import { TaskEither } from 'fp-ts/TaskEither'

const meta: Meta<ButtonArgs> = {
  title: 'Cooler/Button',
  component: Button as any,
  parameters: {},
  tags: ['autodocs'],
  argTypes: buttonArgTypes
}

export default meta
type Story = StoryObj<ButtonArgs>

export const Default: Story = {
  render: props => {
    return (
      <Content>
        <Button
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
    )
  },
  args: {
    label: unsafeLocalizedString('Button'),
    icon: false,
    color: 'default',
    flat: false,
    disabled: false
  }
}

export const IconOnly: Story = {
  render: props => {
    return (
      <Content>
        <Button
          type="iconButton"
          icon={star}
          action={constVoid}
          color={props.color}
          disabled={props.disabled}
        />
      </Content>
    )
  },
  args: {
    color: 'default',
    disabled: false
  }
}

const success: TaskEither<string, void> = taskEither.fromTask(
  pipe(task.fromIO(constVoid), task.delay(2000))
)

const failure: TaskEither<string, void> = pipe(
  task.fromIO(() => either.left('Some Error!')),
  task.delay(2000)
)

export const Loading: Story = {
  render: props => {
    return (
      <Content>
        <LoadingButton
          type="loadingButton"
          label={pipe(
            props.label,
            NonEmptyString.decode,
            option.fromEither,
            option.map(unsafeLocalizedString)
          )}
          action={() =>
            pipe(
              props.result,
              foldLoadingButtonResult(
                () => success,
                () => failure
              )
            )
          }
          icon={send}
          color={props.color}
          flat={props.flat}
          disabled={props.disabled}
        />
      </Content>
    )
  },
  argTypes: {
    ...buttonArgTypes,
    result: {
      name: 'Result',
      control: {
        type: 'select',
        options: ['Success', 'Failure']
      },
      description:
        'Whether the button should be in a successful or error state after loading'
    }
  },
  args: {
    label: unsafeLocalizedString('Loading button'),
    color: 'default',
    flat: false,
    disabled: false,
    result: 'Success'
  }
}
