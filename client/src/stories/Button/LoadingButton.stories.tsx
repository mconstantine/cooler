import { Meta, Story } from '@storybook/react'
import { either, task, taskEither } from 'fp-ts'
import { pipe, constVoid } from 'fp-ts/function'
import { send } from 'ionicons/icons'
import { unsafeLocalizedString } from '../../a18n'
import { Buttons } from '../../components/Button/Buttons/Buttons'
import { LoadingButton as LoadingButtonComponent } from '../../components/Button/LoadingButton/LoadingButton'
import { Content } from '../../components/Content/Content'
import { CoolerStory } from '../CoolerStory'

export const LoadingButton: Story = () => {
  return (
    <CoolerStory>
      <Content>
        <Buttons>
          <LoadingButtonComponent
            type="button"
            label={unsafeLocalizedString('I succeed')}
            action={taskEither.fromTask(
              pipe(task.fromIO(constVoid), task.delay(2000))
            )}
            icon={send}
            color="primary"
          />
          <LoadingButtonComponent
            type="button"
            label={unsafeLocalizedString('I fail')}
            action={pipe(
              task.fromIO(() => either.left(new Error('Some Error!'))),
              task.delay(2000)
            )}
            icon={send}
            color="primary"
            flat
          />
          <LoadingButtonComponent
            type="input"
            label={unsafeLocalizedString('Disabled input')}
            icon={send}
            disabled
          />
        </Buttons>
      </Content>
    </CoolerStory>
  )
}

const meta: Meta = {
  title: 'Cooler/Buttons/Loading Button'
}

export default meta
