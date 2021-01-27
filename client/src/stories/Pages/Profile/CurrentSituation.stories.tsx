import { Meta, Story } from '@storybook/react'
import { boolean, task, taskEither } from 'fp-ts'
import { pipe } from 'fp-ts/function'
import { TaskEither } from 'fp-ts/TaskEither'
import { useState } from 'react'
import { unsafeLocalizedString } from '../../../a18n'
import { Content } from '../../../components/Content/Content'
import { CurrentSituation as CurrentSituationComponent } from '../../../components/Pages/Profile/CurrentSituation'
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

export const CurrentSituation: Story<Args> = props => {
  const [since, setSince] = useState(new Date(2021, 0, 1))
  const to = new Date(2021, 0, 31)
  const pastDays = Math.round((to.getTime() - since.getTime()) / 86400000)

  const expectedWorkingHours = unsafeNonNegativeNumber(
    Math.max(pastDays * 8, 0)
  )
  const actualWorkingHours = unsafeNonNegativeNumber(
    Math.max(expectedWorkingHours - 8, 0)
  )
  const budget = unsafeNonNegativeNumber(expectedWorkingHours * 15)
  const balance = unsafeNonNegativeNumber(actualWorkingHours * 15)

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
        <CurrentSituationComponent
          since={since}
          onSinceDateChange={onSinceDateChange}
          data={{
            expectedWorkingHours,
            actualWorkingHours,
            budget,
            balance,
            taxes
          }}
        />
      </Content>
    </CoolerStory>
  )
}

const meta: Meta<Args> = {
  title: 'Cooler/Pages/Profile/Current Situation',
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
