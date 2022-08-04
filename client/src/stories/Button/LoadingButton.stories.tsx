import { Meta, Story } from '@storybook/react'
import { either, task, taskEither } from 'fp-ts'
import { pipe, constVoid } from 'fp-ts/function'
import { send } from 'ionicons/icons'
import { unsafeLocalizedString } from '../../a18n'
import { LoadingButton as LoadingButtonComponent } from '../../components/Button/LoadingButton/LoadingButton'
import { Content } from '../../components/Content/Content'
import { CoolerStory } from '../CoolerStory'
import { ButtonArgs, buttonArgTypes } from './args'

type LoadingButtonResult = 'Success' | 'Failure'

function foldLoadingButtonResult<T>(
  whenSuccess: () => T,
  whenFailure: () => T
): (result: LoadingButtonResult) => T {
  return result => {
    switch (result) {
      case 'Success':
        return whenSuccess()
      case 'Failure':
        return whenFailure()
    }
  }
}

type Args = Omit<ButtonArgs, 'icon'> & {
  result: LoadingButtonResult
}

const success = taskEither.fromTask(
  pipe(task.fromIO(constVoid), task.delay(2000))
)

const failure = pipe(
  task.fromIO(() => either.left(new Error('Some Error!'))),
  task.delay(2000)
)

const LoadingButtonTemplate: Story<Args> = props => {
  return (
    <CoolerStory>
      <Content>
        <LoadingButtonComponent
          type="loadingButton"
          label={props.label}
          action={pipe(
            props.result,
            foldLoadingButtonResult(
              () => success,
              () => failure
            )
          )}
          icon={send}
          color={props.color}
          flat={props.flat}
          disabled={props.disabled}
        />
      </Content>
    </CoolerStory>
  )
}

export const LoadingButton = LoadingButtonTemplate.bind({})

LoadingButton.args = {
  label: unsafeLocalizedString('Loading button'),
  color: 'default',
  flat: false,
  disabled: false,
  result: 'Success'
}

LoadingButton.argTypes = {
  ...buttonArgTypes,
  result: {
    name: 'Result',
    control: {
      type: 'select',
      options: ['Success', 'Error']
    },
    description:
      'Whether the button should be in a successful or error state after loading'
  }
}

const meta: Meta<Args> = {
  title: 'Cooler/Buttons/Loading Button'
}

export default meta
