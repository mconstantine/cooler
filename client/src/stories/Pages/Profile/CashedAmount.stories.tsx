import { Meta, Story } from '@storybook/react'
import { boolean, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { CashedAmount as CashedAmountComponent } from '../../../components/Pages/Profile/CashedAmount'
import { Tax } from '../../../entities/Tax'
import {
  LocalizedString,
  unsafeNonNegativeNumber,
  unsafePercentage
} from '../../../globalDomain'
import { CoolerStory } from '../../CoolerStory'

interface Args {
  shouldFail: boolean
}

export const CashedAmount: Story<Args> = props => {
  const [since, setSince] = useState(new Date(2021, 0, 1))

  const cashedBalance = unsafeNonNegativeNumber(
    (Math.floor(
      (new Date(2021, 0, 31).getTime() - since.getTime()) / 86400000
    ) /
      365) *
      200 *
      120
  )

  const taxes: Tax[] = [
    {
      label: unsafeLocalizedString('Some tax'),
      value: unsafePercentage(0.2572)
    },
    {
      label: unsafeLocalizedString('Some other tax'),
      value: unsafePercentage(0.1005)
    }
  ]

  const onSinceDateChange = (since: Date): TaskEither<LocalizedString, void> =>
    pipe(
      props.shouldFail,
      boolean.fold(
        (): TaskEither<LocalizedString, void> =>
          pipe(
            task.fromIO(() => setSince(since)),
            task.delay(500),
            taskEither.rightTask
          ),
        (): TaskEither<LocalizedString, void> =>
          pipe(
            task.fromIO(() => unsafeLocalizedString("I'm an error!")),
            task.delay(500),
            taskEither.leftTask
          )
      )
    )

  return (
    <CoolerStory>
      <Content>
        <CashedAmountComponent
          data={{
            since,
            cashedBalance,
            taxes
          }}
          onSinceDateChange={onSinceDateChange}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta<Args> = {
  title: 'Cooler/Pages/Profile/Cashed Amount',
  args: {
    shouldFail: false
  },
  argTypes: {
    shouldFail: {
      name: 'Should fail',
      control: 'boolean',
      description: 'Set this to true and change date to make the change fail'
    }
  }
}

export default meta
